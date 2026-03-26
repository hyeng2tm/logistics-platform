package com.logistics.platform.service.system;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CopyOnWriteArrayList;

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
    private final RestTemplate restTemplate = new RestTemplate(); // For simplicity, using new instance or could be a bean
    private final List<Map<String, Object>> history = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        log.info("System monitoring service initialized. Loading history from health service...");
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

    @Scheduled(fixedRate = 1, timeUnit = TimeUnit.MINUTES)
    public void captureSnapshot() {
        log.debug("Capturing system monitoring snapshot and sending to health service");
        Map<String, Object> summary = getSystemSummary();
        
        // Persist to health service
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

        history.add(summary);
        if (history.size() > 1440) {
            history.remove(0);
        }
    }

    private Map<String, Object> convertToSnapshotMap(Map<String, Object> logData) {
        String ts = (String) logData.get("timestamp");
        
        // Simplified conversion for UI
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
            "dbServer", createServiceStats("Database Server", 8 + random.nextInt(5), 30 + random.nextInt(5), "Healthy", 12.0 + random.nextFloat() * 5, 450.0 + random.nextFloat() * 50, 0.0, 2),
            "timestamp", Instant.now().toString()
        );
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
            Map<String, Object>[] summaries = restTemplate.getForObject(healthServiceUrl + "/api/v1/health/traces/summary", Map[].class);
            if (summaries != null) {
                return Arrays.asList(summaries);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch SRE analysis data from health service: {}", e.getMessage());
        }
        return new ArrayList<>();
    }
}
