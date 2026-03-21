package com.logistics.platform.service.system;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import java.util.concurrent.TimeUnit;

import com.logistics.platform.dto.system.ExecutionLog;
import com.logistics.platform.domain.system.MonitoringLog;
import com.logistics.platform.repository.system.MonitoringLogRepository;
import com.logistics.platform.domain.system.SystemMetricsLog;
import com.logistics.platform.repository.system.SystemMetricsLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import jakarta.annotation.PostConstruct;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemMonitoringService {

    private final Random random = new Random();
    private final MeterRegistry meterRegistry;
    private final MonitoringLogRepository monitoringLogRepository;
    private final SystemMetricsLogRepository systemMetricsLogRepository;
    private final List<Map<String, Object>> history = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        log.info("System monitoring service initialized. Loading history from DB...");
        // Load last 288 snapshots from DB and populate history
        List<SystemMetricsLog> savedLogs = systemMetricsLogRepository.findTop288ByOrderByTimestampDesc();
        // reverse to have oldest first for history
        for (int i = savedLogs.size() - 1; i >= 0; i--) {
            history.add(convertToSnapshotMap(savedLogs.get(i)));
        }
        log.info("Loaded {} monitoring snapshots from database.", history.size());
        
        // Seed execution logs if empty for better initial experience
        if (monitoringLogRepository.count() == 0) {
            log.info("Seeding initial execution logs for demonstration...");
            seedExecutionLogs();
        }
    }

    private void seedExecutionLogs() {
        String[] services = {"SystemAdminService", "BatchManagementService", "AuthService", "OrderService", "DeliveryService"};
        String[] methods = {"findAll", "findById", "save", "updateStatus", "processQueue"};
        
        for (int i = 0; i < 20; i++) {
            LocalDateTime ts = LocalDateTime.now().minusMinutes(i * 15L);
            addExecutionLog(ExecutionLog.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(ts)
                .serviceName(services[random.nextInt(services.length)])
                .methodName(methods[random.nextInt(methods.length)])
                .duration(50 + random.nextInt(500))
                .usedMemory(100 + random.nextInt(200))
                .totalMemory(1024)
                .query("SELECT * FROM sample_table WHERE id = ?")
                .status(random.nextDouble() > 0.1 ? "Success" : "Error: Connection Timeout")
                .build());
        }
    }

    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    public void captureSnapshot() {
        log.debug("Capturing system monitoring snapshot");
        Map<String, Object> summary = getSystemSummary();
        
        // Persist to DB
        Object backendObj = summary.get("sysBackend");
        if (backendObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> backend = (Map<String, Object>) backendObj;
            SystemMetricsLog logEntity = SystemMetricsLog.builder()
                .timestamp(LocalDateTime.parse((String) summary.get("timestamp"), DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .cpuUsage((Double) backend.get("cpu"))
                .memoryUsage(((Integer) backend.get("memory")).doubleValue())
                .latency((Double) backend.get("latency"))
                .tps((Double) backend.get("tps"))
                .errorRate((Double) backend.get("errorRate"))
                .build();
            if (logEntity != null) {
                systemMetricsLogRepository.save(logEntity);
            }
        }

        history.add(summary);
        if (history.size() > 288) {
            history.remove(0);
        }
    }

    private Map<String, Object> convertToSnapshotMap(SystemMetricsLog log) {
        String ts = log.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        // We reconstruct the full summary mask using the backend metrics from DB and defaults for others
        return Map.of(
            "sysBackend", createServiceStats("System Backend", log.getCpuUsage(), log.getMemoryUsage().intValue(), "Healthy", log.getLatency(), log.getTps(), log.getErrorRate(), 3),
            "authServer", createServiceStats("Auth Server", 30.0, 60, "Healthy", 50.0, 120.0, 0.02, 2),
            "batchServer", createServiceStats("Batch Server", 15.0, 45, "Healthy", 1000.0, 5.0, 0.0, 1),
            "dbServer", createServiceStats("Database Server", 10.0, 35, "Healthy", 15.0, 400.0, 0.0, 2),
            "timestamp", ts
        );
    }

    public List<Map<String, Object>> getHistory() {
        return new ArrayList<>(history);
    }

    public List<ExecutionLog> getExecutionLogs() {
        return monitoringLogRepository.findTop500ByOrderByTimestampDesc().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    public void addExecutionLog(ExecutionLog dto) {
        MonitoringLog entity = MonitoringLog.builder()
            .id(dto.getId() != null ? dto.getId() : UUID.randomUUID().toString())
            .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now())
            .serviceName(dto.getServiceName())
            .methodName(dto.getMethodName())
            .duration(dto.getDuration())
            .usedMemory(dto.getUsedMemory())
            .totalMemory(dto.getTotalMemory())
            .query(dto.getQuery())
            .status(dto.getStatus())
            .build();
            
        if (entity != null) {
            monitoringLogRepository.save(entity);
        }
    }

    private ExecutionLog convertToDto(MonitoringLog entity) {
        return ExecutionLog.builder()
            .id(entity.getId())
            .timestamp(entity.getTimestamp())
            .serviceName(entity.getServiceName())
            .methodName(entity.getMethodName())
            .duration(entity.getDuration())
            .usedMemory(entity.getUsedMemory())
            .totalMemory(entity.getTotalMemory())
            .query(entity.getQuery())
            .status(entity.getStatus())
            .build();
    }

    // Mock execution log generator removed.


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

        // Aggregate last 5 minutes of traces from DB
        LocalDateTime fiveMinAgo = LocalDateTime.now().minusMinutes(5);
        List<ExecutionLog> recentTraces = monitoringLogRepository.findTop500ByOrderByTimestampDesc().stream()
            .filter(log -> log.getTimestamp().isAfter(fiveMinAgo))
            .map(this::convertToDto)
            .toList();

        double avgDuration = recentTraces.isEmpty() ? 0 : recentTraces.stream().mapToLong(ExecutionLog::getDuration).average().orElse(0);
        double maxMem = recentTraces.isEmpty() ? 0 : recentTraces.stream().mapToDouble(ExecutionLog::getUsedMemory).max().orElse(0);

        return Map.of(
            "sysBackend", createServiceStats("System Backend", cpuLoad, (int)systemMemoryUsage, "Healthy", sysLatency, sysTps, sysErrorRate, 3),
            "authServer", createServiceStats("Auth Server", 30 + random.nextInt(10), 55 + random.nextInt(5), "Healthy", 45.0 + random.nextInt(10), 120.0 + random.nextFloat() * 10, 0.01, 2),
            "batchServer", createServiceStats("Batch Server", 15 + random.nextInt(5), 40 + random.nextInt(10), "Healthy", 1200.0 + random.nextInt(200), 5.0 + random.nextFloat() * 2, 0.0, 1),
            "dbServer", createServiceStats("Database Server", 8 + random.nextInt(5), 30 + random.nextInt(5), "Healthy", 12.0 + random.nextFloat() * 5, 450.0 + random.nextFloat() * 50, 0.0, 2),
            "traceCount", recentTraces.size(),
            "traceAvgDuration", avgDuration,
            "traceMaxMemory", maxMem,
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
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
            // This is a rough total count, not real-time TPS without state.
            // For a real TPS, we'd need to compare with previous snapshot.
            // Using a mock-up based on total count for demonstration or returning 0 if no requests.
            return timer.count() > 0 ? (double)timer.count() / 60.0 : 0.0; // Mocked rate
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
        List<Map<String, Object>> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        String[] levels = {"INFO", "WARN", "ERROR", "DEBUG"};
        String[] messages = {
            "User 'admin' logged in successfully from 192.168.1.10",
            "Batch job 'DailyReportJob' started",
            "Database connection pool size increased to 20",
            "Slow query detected: SELECT * FROM large_table...",
            "Failed to send email notification to user@example.com",
            "Configuration updated: spring.datasource.hikari.maximum-pool-size=20",
            "System healthy: All services are responding",
            "Cache eviction triggered for 'menu_cache'",
            "External API 'LogisticsProvider' responded with 200 OK",
            "Resource threshold reached: CPU > 80% on Instance 2"
        };

        for (int i = 0; i < 15; i++) {
            logs.add(Map.of(
                "id", i + 1,
                "timestamp", now.minusSeconds(i * 120L).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "level", levels[random.nextInt(levels.length)],
                "message", messages[random.nextInt(messages.length)]
            ));
        }
        return logs;
    }

    // Mock snapshot generator removed.
}
