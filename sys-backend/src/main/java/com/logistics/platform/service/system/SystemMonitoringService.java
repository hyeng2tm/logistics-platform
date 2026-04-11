package com.logistics.platform.service.system;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import com.logistics.platform.config.database.ReplicationRoutingDataSource;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;

import com.logistics.platform.dto.system.ExecutionLog;
import org.springframework.scheduling.annotation.Scheduled;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemMonitoringService {

    @Value("${spring.application.name:logistics-platform}")
    private String appId;

    @Value("${app.health-service.url:http://hea-backend:8081}")
    private String healthServiceUrl;

    private final Random random = new Random();
    private final MeterRegistry meterRegistry;
    private final RestTemplate restTemplate = new RestTemplate();
    private final List<Map<String, Object>> history = new CopyOnWriteArrayList<>();
    private final org.springframework.context.ApplicationContext applicationContext;

    @PostConstruct
    public void init() {
        log.info("System monitoring service initialized. Health Service URL: {}", healthServiceUrl);
        log.info("Loading history from health service...");
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object>[] savedLogs = restTemplate.getForObject(healthServiceUrl + "/api/v1/health/history", Map[].class);
            if (savedLogs != null) {
                for (int i = savedLogs.length - 1; i >= 0; i--) {
                    Map<String, Object> logData = savedLogs[i];
                    history.add(convertToSnapshotMap(logData));
                }
                log.info("Loaded {} monitoring snapshots from health service.", history.size());
            }
        } catch (Exception e) {
            log.warn("Failed to load history from health service: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 60000)
    public void captureMetrics() {
        log.debug("Capturing system monitoring snapshot and sending to health service");
        
        Map<String, Object> summary = getSystemSummary();
        history.add(summary);
        if (history.size() > 1440) history.remove(0);
        
        // Report specific DB metrics per pool
        Map<String, HikariDataSource> pools = new HashMap<>();
        Set<String> seenUrls = new HashSet<>();
        
        // 1. Explicitly find and scan ReplicationRoutingDataSources
        Map<String, ReplicationRoutingDataSource> routingBeans = applicationContext.getBeansOfType(ReplicationRoutingDataSource.class);
        for (Map.Entry<String, ReplicationRoutingDataSource> entry : routingBeans.entrySet()) {
            discoverPools(entry.getKey(), entry.getValue(), pools, seenUrls);
        }

        // 2. Scan ALL beans to find other Hikari pools
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        for (String beanName : beanNames) {
            if (beanName == null) continue;
            try {
                Object bean = applicationContext.getBean(beanName);
                if (bean instanceof DataSource) {
                    discoverPools(beanName, (DataSource) bean, pools, seenUrls);
                }
            } catch (Exception e) {
                log.trace("Skipping bean {} during discovery: {}", beanName, e.getMessage());
            }
        }
        
        log.info("System metrics capture: discovered {} unique Hikari connection pools", pools.size());
        
        for (Map.Entry<String, HikariDataSource> entry : pools.entrySet()) {
            reportDbMetrics(entry.getKey(), entry.getValue());
        }

        // Report system metrics to health service
        Object backendObj = summary.get("sysBackend");
        if (backendObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> backend = (Map<String, Object>) backendObj;
            Map<String, Object> logRequest = Map.of(
                "id", UUID.randomUUID().toString(),
                "timestamp", summary.get("timestamp"),
                "appId", appId,
                "cpuUsage", backend.get("cpu"),
                "memoryUsage", ((Number) backend.get("memory")).doubleValue(),
                "latency", backend.get("latency"),
                "tps", backend.get("tps"),
                "errorRate", backend.get("errorRate")
            );
            try {
                restTemplate.postForObject(healthServiceUrl + "/api/v1/health/metrics", logRequest, Void.class);
            } catch (Exception e) {
                log.warn("Failed to send metrics to health service: {}", e.getMessage());
            }
        }
    }

    private void discoverPools(String name, DataSource ds, Map<String, HikariDataSource> pools, Set<String> seenUrls) {
        if (ds == null) return;
        
        DataSource target = ds;
        // Aggressively unwrap proxies
        int maxDepth = 10;
        while (maxDepth-- > 0 && (target instanceof org.springframework.aop.framework.Advised || 
               target instanceof org.springframework.jdbc.datasource.DelegatingDataSource ||
               target instanceof LazyConnectionDataSourceProxy)) {
            try {
                if (target instanceof org.springframework.aop.framework.Advised) {
                    Object next = ((org.springframework.aop.framework.Advised) target).getTargetSource().getTarget();
                    if (next instanceof DataSource && next != target) { target = (DataSource) next; continue; }
                }
                if (target instanceof org.springframework.jdbc.datasource.DelegatingDataSource) {
                    DataSource next = ((org.springframework.jdbc.datasource.DelegatingDataSource) target).getTargetDataSource();
                    if (next != null && next != target) { target = next; continue; }
                }
                if (target instanceof LazyConnectionDataSourceProxy) {
                    DataSource next = ((LazyConnectionDataSourceProxy) target).getTargetDataSource();
                    if (next != null && next != target) { target = next; continue; }
                }
            } catch (Exception e) { break; }
            break;
        }

        // 1. Check for HikariDataSource
        HikariDataSource hikari = null;
        if (target instanceof HikariDataSource) {
            hikari = (HikariDataSource) target;
        } else {
            try {
                if (target.isWrapperFor(HikariDataSource.class)) {
                    hikari = target.unwrap(HikariDataSource.class);
                }
            } catch (Exception ignored) {}
        }

        if (hikari != null) {
            String url = hikari.getJdbcUrl();
            // Use pool name + URL as unique key if multiple pools connect to the same URL
            String poolKey = (url != null ? url : "") + "|" + hikari.getPoolName();
            if (!seenUrls.contains(poolKey)) {
                log.info("[Discovery-Success] Found HikariDataSource: {} ({})", name, poolKey);
                pools.put(name, hikari);
                seenUrls.add(poolKey);
            }
            return;
        }

        // 2. Specialized handling for Routing Data Sources
        if (target instanceof ReplicationRoutingDataSource) {
            ReplicationRoutingDataSource routing = (ReplicationRoutingDataSource) target;
            Map<Object, Object> map = routing.getDataSourceMap();
            if (map != null) {
                for (Map.Entry<Object, Object> entry : map.entrySet()) {
                    if (entry.getValue() instanceof DataSource) {
                        discoverPools(entry.getKey().toString(), (DataSource) entry.getValue(), pools, seenUrls);
                    }
                }
            }
        }
    }

    private void reportDbMetrics(String type, HikariDataSource ds) {
        try {
            HikariPoolMXBean poolBean = ds.getHikariPoolMXBean();
            
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("appId", appId);
            
            String normalizedType = type.toLowerCase().contains("master") ? "master" : type.toLowerCase();
            metrics.put("dbType", normalizedType);
            
            if (poolBean != null) {
                metrics.put("activeConnections", poolBean.getActiveConnections());
                metrics.put("idleConnections", poolBean.getIdleConnections());
                metrics.put("totalConnections", poolBean.getTotalConnections());
                metrics.put("threadsAwaitingConnection", poolBean.getThreadsAwaitingConnection());
                metrics.put("status", "UP");
            } else {
                // Pool not initialized yet
                metrics.put("activeConnections", 0);
                metrics.put("idleConnections", 0);
                metrics.put("totalConnections", 0);
                metrics.put("threadsAwaitingConnection", 0);
                metrics.put("status", "UP"); // Mark as UP but idle/initializing
            }
            
            metrics.put("timestamp", Instant.now().toString());
            
            // Resource usage simulation
            int active = poolBean != null ? poolBean.getActiveConnections() : 0;
            int total = poolBean != null ? poolBean.getTotalConnections() : 0;
            
            double baseCpu = normalizedType.contains("master") ? 10.0 : 5.0;
            double simulatedCpu = Math.min(99.0, baseCpu + (active * 1.5) + random.nextDouble() * 5);
            double simulatedMem = Math.min(99.0, 20.0 + (total * 0.5) + random.nextDouble() * 2);
            
            metrics.put("cpuUsage", simulatedCpu);
            metrics.put("memoryUsage", simulatedMem);
            
            List<Map<String, Object>> payload = List.of(metrics);
            log.info("[Report-Debug] Reporting metrics for {}. URL: {}, Payload size: {}", normalizedType, healthServiceUrl + "/api/v1/health/db-metrics", payload.size());
            restTemplate.postForObject(healthServiceUrl + "/api/v1/health/db-metrics", payload, Void.class);
            log.info("[Report-Success] Metric reported successfully for {}", normalizedType);
        } catch (Exception e) {
            log.error("[Report-Error] Failed to report DB metrics for {}: {}", type, e.getMessage());
        }
    }

    private Map<String, Object> convertToSnapshotMap(Map<String, Object> logData) {
        String ts = (String) logData.get("timestamp");
        return Map.of(
            "sysBackend", createServiceStats("System Backend", 
                ((Number)logData.get("cpuUsage")).doubleValue(), 
                ((Number)logData.get("memoryUsage")).intValue(), 
                "Healthy", 
                ((Number)logData.get("latency")).doubleValue(), 
                ((Number)logData.get("tps")).doubleValue(), 
                ((Number)logData.get("errorRate")).doubleValue(), 3),
            "authServer", createServiceStats("Auth Server", 30.0, 60, "Healthy", 50.0, 120.0, 0.02, 2),
            "batchServer", createServiceStats("Batch Server", 15.0, 40, "Healthy", 0.0, 0.0, 0.0, 1),
            "dbServer", createServiceStats("Database Server", 10.0, 35, "Healthy", 15.0, 400.0, 0.0, 2),
            "timestamp", ts
        );
    }

    public List<Map<String, Object>> getHistory() {
        return new ArrayList<>(history);
    }

    public List<ExecutionLog> getExecutionLogs() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object>[] savedTraces = restTemplate.getForObject(healthServiceUrl + "/api/v1/health/traces", Map[].class);
            if (savedTraces != null) {
                List<ExecutionLog> logs = new ArrayList<>();
                for (Map<String, Object> trace : savedTraces) {
                    logs.add(convertToExecutionLog(trace));
                }
                return logs;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch execution logs from health service: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    private ExecutionLog convertToExecutionLog(Map<String, Object> data) {
        return ExecutionLog.builder()
                .id((String) data.get("id"))
                .timestamp(data.get("timestamp") != null ? Instant.parse(data.get("timestamp").toString()) : null)
                .appId((String) data.get("appId"))
                .serviceName((String) data.get("serviceName"))
                .methodName((String) data.get("methodName"))
                .duration(((Number) data.get("duration")).longValue())
                .usedMemory(((Number) data.get("usedMemory")).doubleValue())
                .totalMemory(((Number) data.get("totalMemory")).doubleValue())
                .query((String) data.get("query"))
                .status((String) data.get("status"))
                .build();
    }

    public void addExecutionLog(ExecutionLog dto) {
        Map<String, Object> traceRequest = Map.of(
            "id", dto.getId() != null ? dto.getId() : UUID.randomUUID().toString(),
            "timestamp", dto.getTimestamp() != null ? dto.getTimestamp() : Instant.now(),
            "appId", appId,
            "serviceName", dto.getServiceName(),
            "methodName", dto.getMethodName(),
            "duration", dto.getDuration(),
            "usedMemory", dto.getUsedMemory(),
            "totalMemory", dto.getTotalMemory(),
            "query", dto.getQuery() != null ? dto.getQuery() : "",
            "status", dto.getStatus() != null ? dto.getStatus() : "success"
        );
        try {
            restTemplate.postForObject(healthServiceUrl + "/api/v1/health/traces", traceRequest, Void.class);
        } catch (Exception e) {
            log.warn("Failed to send trace to health service: {}", e.getMessage());
        }
    }

    public Map<String, Object> getSystemSummary() {
        meterRegistry.counter("system.monitoring.summary.fetch.total").increment();
        com.sun.management.OperatingSystemMXBean osBean = (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        
        double cpuLoad = osBean.getCpuLoad() * 100;
        if (cpuLoad < 0) cpuLoad = 0.0;
        
        long totalMemory = osBean.getTotalMemorySize();
        long freeMemory = osBean.getFreeMemorySize();
        double systemMemoryUsage = totalMemory > 0 ? ((double)(totalMemory - freeMemory) / totalMemory) * 100 : 0.0;
        
        double sysLatency = getAverageLatency();
        double sysTps = getTps();
        double sysErrorRate = getErrorRate();

        return Map.of(
            "sysBackend", createServiceStats("System Backend", cpuLoad, (int)systemMemoryUsage, "Healthy", sysLatency, sysTps, sysErrorRate, 3),
            "authServer", createServiceStats("Auth Server", 30 + random.nextInt(10), 55 + random.nextInt(5), "Healthy", 45.0 + random.nextInt(10), 120.0 + random.nextFloat() * 10, 0.01, 2),
            "batchServer", createServiceStats("Batch Server", 15.0, 40, "Healthy", 0.0, 0.0, 0.0, 1),
            "dbServer", getDbServerStats(),
            "timestamp", Instant.now().toString()
        );
    }

    private Map<String, Object> getDbServerStats() {
        int totalActive = 0;
        Map<String, DataSource> dsBeans = applicationContext.getBeansOfType(DataSource.class);
        Map<String, HikariDataSource> pools = new HashMap<>();
        Set<String> seenUrls = new HashSet<>();
        
        for (DataSource ds : dsBeans.values()) {
            discoverPools("temp", ds, pools, seenUrls);
        }
        
        for (HikariDataSource hds : pools.values()) {
            HikariPoolMXBean bean = hds.getHikariPoolMXBean();
            if (bean != null) totalActive += bean.getActiveConnections();
        }
        
        double avgCpu = pools.isEmpty() ? 5.0 : pools.values().stream()
                .mapToDouble(hds -> 10.0 + (hds.getHikariPoolMXBean() != null ? hds.getHikariPoolMXBean().getActiveConnections() * 2.0 : 0))
                .average().orElse(5.0);
        
        return createServiceStats("Database Server", Math.min(95, avgCpu), 25 + random.nextInt(10), "Healthy", 10.0 + random.nextFloat() * 5, (double)totalActive * 10, 0.0, Math.max(1, pools.size()));
    }

    private Map<String, Object> createServiceStats(String name, double cpu, int mem, String status, double latency, double tps, double errorRate, int instanceCount) {
        List<Map<String, Object>> instances = new ArrayList<>();
        for (int i = 1; i <= instanceCount; i++) {
            instances.add(Map.of(
                "id", name.toLowerCase().replace(" ", "-") + "-" + i,
                "status", "Healthy",
                "cpu", Math.max(0, cpu + (random.nextDouble() * 4 - 2)),
                "memory", Math.min(100, mem + random.nextInt(6) - 3)
            ));
        }
        return Map.of(
            "name", name,
            "cpu", cpu,
            "memory", mem,
            "status", status,
            "latency", latency,
            "tps", tps,
            "errorRate", errorRate,
            "instances", instances
        );
    }
    
    private double getAverageLatency() {
        var timer = meterRegistry.find("http.server.requests").timer();
        if (timer != null && timer.count() > 0) {
            return timer.mean(TimeUnit.MILLISECONDS);
        }
        return 0.0;
    }
    
    private double getTps() {
        var timer = meterRegistry.find("http.server.requests").timer();
        if (timer != null) {
            return timer.count() > 0 ? (double)timer.count() / 60.0 : 0.0; 
        }
        return 0.0;
    }
    
    private double getErrorRate() {
        var allRequests = meterRegistry.find("http.server.requests").timer();
        if (allRequests == null || allRequests.count() == 0) return 0.0;
        
        long total = allRequests.count();
        long errors = meterRegistry.find("http.server.requests").tag("status", s -> s.startsWith("5")).timers()
                .stream().mapToLong(Timer::count).sum();
        
        return ((double)errors / total) * 100.0;
    }

    public List<Map<String, Object>> getSystemLogs() {
        return new ArrayList<>();
    }

    public List<Map<String, Object>> getSreAnalysis() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object>[] data = restTemplate.getForObject(healthServiceUrl + "/api/v1/health/sre-analysis", Map[].class);
            if (data != null) return Arrays.asList(data);
        } catch (Exception e) {
            log.warn("Failed to fetch SRE analysis from health service: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    public List<Map<String, Object>> getDatabaseMetrics() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object>[] metrics = restTemplate.getForObject(healthServiceUrl + "/api/v1/health/db-metrics", Map[].class);
            if (metrics != null) return Arrays.asList(metrics);
        } catch (Exception e) {
            log.warn("Failed to fetch DB metrics from health service: {}", e.getMessage());
        }
        return new ArrayList<>();
    }
}
