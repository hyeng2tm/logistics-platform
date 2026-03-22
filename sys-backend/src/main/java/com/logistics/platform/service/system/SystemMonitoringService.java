package com.logistics.platform.service.system;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

import org.springframework.beans.factory.annotation.Value;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemMonitoringService {

    @Value("${spring.application.name:logistics-platform}")
    private String appId;

    private final Random random = new Random();
    private final MeterRegistry meterRegistry;
    private final MonitoringLogRepository monitoringLogRepository;
    private final SystemMetricsLogRepository systemMetricsLogRepository;
    private final List<Map<String, Object>> history = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        log.info("System monitoring service initialized. Loading history from DB...");
        
        List<SystemMetricsLog> savedLogs = systemMetricsLogRepository.findTop1440ByOrderByTimestampDesc();
        for (int i = savedLogs.size() - 1; i >= 0; i--) {
            history.add(convertToSnapshotMap(savedLogs.get(i)));
        }
        log.info("Loaded {} monitoring snapshots from database.", history.size());
    }



    @Scheduled(fixedRate = 1, timeUnit = TimeUnit.MINUTES)
    public void captureSnapshot() {
        log.debug("Capturing system monitoring snapshot");
        Map<String, Object> summary = getSystemSummary();
        
        // Persist to DB
        Object backendObj = summary.get("sysBackend");
        if (backendObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> backend = (Map<String, Object>) backendObj;
            SystemMetricsLog logEntity = SystemMetricsLog.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(Instant.parse((String) summary.get("timestamp")))
                .appId(appId)
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
        if (history.size() > 1440) {
            history.remove(0);
        }
    }

    private Map<String, Object> convertToSnapshotMap(SystemMetricsLog log) {
        String ts = log.getTimestamp().toString();
        
        // Try to find matching batch log around the same time
        var batchLogs = systemMetricsLogRepository.findTop10ByAppIdOrderByTimestampDesc("batch-server");
        double batchCpu = 15.0;
        int batchMem = 45;
        if (!batchLogs.isEmpty()) {
            batchCpu = batchLogs.get(0).getCpuUsage();
            batchMem = batchLogs.get(0).getMemoryUsage().intValue();
        }

        return Map.of(
            "sysBackend", createServiceStats("System Backend", log.getCpuUsage(), log.getMemoryUsage().intValue(), "Healthy", log.getLatency(), log.getTps(), log.getErrorRate(), 3),
            "authServer", createServiceStats("Auth Server", 30.0, 60, "Healthy", 50.0, 120.0, 0.02, 2),
            "batchServer", createServiceStats("Batch Server", batchCpu, batchMem, "Healthy", 0.0, 0.0, 0.0, 1),
            "dbServer", createServiceStats("Database Server", 10.0, 35, "Healthy", 15.0, 400.0, 0.0, 2),
            "timestamp", ts
        );
    }

    public List<Map<String, Object>> getHistory() {
        return new ArrayList<>(history);
    }

    public List<ExecutionLog> getExecutionLogs() {
        return monitoringLogRepository.findTop1440ByOrderByTimestampDesc().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    public void addExecutionLog(ExecutionLog dto) {
        MonitoringLog entity = MonitoringLog.builder()
            .id(dto.getId() != null ? dto.getId() : UUID.randomUUID().toString())
            .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : Instant.now())
            .appId(appId)
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
            .appId(entity.getAppId())
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

        // Fetch actual batch metrics from its log table
        var batchLogs = systemMetricsLogRepository.findTop10ByAppIdOrderByTimestampDesc("batch-server");
        double batchCpu = 15.0;
        int batchMem = 40;
        if (!batchLogs.isEmpty()) {
            batchCpu = batchLogs.get(0).getCpuUsage();
            batchMem = batchLogs.get(0).getMemoryUsage().intValue();
        }

        // Aggregate last 5 minutes of traces from DB
        Instant fiveMinAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        List<ExecutionLog> recentTraces = monitoringLogRepository.findTop1440ByOrderByTimestampDesc().stream()
            .filter(log -> log.getTimestamp().isAfter(fiveMinAgo))
            .map(this::convertToDto)
            .toList();

        double avgDuration = recentTraces.isEmpty() ? 0 : recentTraces.stream().mapToLong(ExecutionLog::getDuration).average().orElse(0);
        double maxMem = recentTraces.isEmpty() ? 0 : recentTraces.stream().mapToDouble(ExecutionLog::getUsedMemory).max().orElse(0);

        return Map.of(
            "sysBackend", createServiceStats("System Backend", cpuLoad, (int)systemMemoryUsage, "Healthy", sysLatency, sysTps, sysErrorRate, 3),
            "authServer", createServiceStats("Auth Server", 30 + random.nextInt(10), 55 + random.nextInt(5), "Healthy", 45.0 + random.nextInt(10), 120.0 + random.nextFloat() * 10, 0.01, 2),
            "batchServer", createServiceStats("Batch Server", batchCpu, batchMem, "Healthy", 0.0, 0.0, 0.0, 1),
            "dbServer", createServiceStats("Database Server", 8 + random.nextInt(5), 30 + random.nextInt(5), "Healthy", 12.0 + random.nextFloat() * 5, 450.0 + random.nextFloat() * 50, 0.0, 2),
            "traceCount", recentTraces.size(),
            "traceAvgDuration", avgDuration,
            "traceMaxMemory", maxMem,
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
        // Return empty list as mock data generation is removed
        return new ArrayList<>();
    }

    // Mock snapshot generator removed.
}
