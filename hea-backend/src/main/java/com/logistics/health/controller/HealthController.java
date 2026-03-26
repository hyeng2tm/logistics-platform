package com.logistics.health.controller;

import com.logistics.health.domain.MonitoringLog;
import com.logistics.health.domain.MonitoringSummary;
import com.logistics.health.domain.SystemMetricsLog;
import com.logistics.health.repository.MonitoringLogRepository;
import com.logistics.health.repository.MonitoringSummaryRepository;
import com.logistics.health.repository.SystemMetricsLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final SystemMetricsLogRepository metricsRepository;
    private final MonitoringLogRepository monitoringRepository;
    private final MonitoringSummaryRepository summaryRepository;

    @PostMapping("/metrics")
    public void collectMetrics(@RequestBody SystemMetricsLog metrics) {
        if (metrics.getId() == null) {
            metrics.setId(UUID.randomUUID().toString());
        }
        if (metrics.getTimestamp() == null) {
            metrics.setTimestamp(Instant.now());
        }
        metricsRepository.save(metrics);
        log.debug("Collected metrics from app: {}", metrics.getAppId());
    }

    @PostMapping("/traces")
    public void collectTraces(@RequestBody MonitoringLog trace) {
        if (trace.getId() == null) {
            trace.setId(UUID.randomUUID().toString());
        }
        if (trace.getTimestamp() == null) {
            trace.setTimestamp(Instant.now());
        }
        monitoringRepository.save(trace);
        log.debug("Collected trace from app: {}", trace.getAppId());
    }

    @GetMapping("/traces")
    public List<MonitoringLog> getTraces() {
        return monitoringRepository.findTop1440ByOrderByTimestampDesc();
    }

    @GetMapping("/traces/raw")
    public List<MonitoringLog> getRawTraces(
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime) {
        return monitoringRepository.findByTimestampBetween(
                Instant.parse(startTime),
                Instant.parse(endTime)
        );
    }

    @PostMapping("/traces/summary")
    public void saveSummary(@RequestBody List<MonitoringSummary> summaries) {
        summaries.forEach(s -> {
            if (s.getId() == null) {
                s.setId(UUID.randomUUID().toString());
            }
        });
        summaryRepository.saveAll(summaries);
        log.info("Saved {} monitoring summaries", summaries.size());
    }

    @GetMapping("/traces/summary")
    public List<MonitoringSummary> getTracesSummary() {
        return summaryRepository.findAll();
    }

    @GetMapping("/history")
    public List<SystemMetricsLog> getHistory() {
        return metricsRepository.findTop1440ByOrderByTimestampDesc();
    }

    @GetMapping("/metrics/raw")
    public List<SystemMetricsLog> getRawMetrics(
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime) {
        return metricsRepository.findByTimestampBetween(
                Instant.parse(startTime),
                Instant.parse(endTime)
        );
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        List<SystemMetricsLog> recentLogs = metricsRepository.findTop1440ByOrderByTimestampDesc();
        
        // Find latest log for each known app
        Map<String, SystemMetricsLog> latestByApp = new HashMap<>();
        for (SystemMetricsLog log : recentLogs) {
            latestByApp.putIfAbsent(log.getAppId(), log);
        }

        return Map.of(
            "latestMetrics", latestByApp,
            "timestamp", Instant.now().toString()
        );
    }
}
