package com.logistics.batch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringAggregationService {

    @Value("${app.health-service.url:http://hea-backend:8081}")
    private String healthServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void aggregatePreviousHourLogs() {
        // Calculate the previous hour's time range
        Instant now = Instant.now();
        Instant endTime = now.truncatedTo(ChronoUnit.HOURS).minusNanos(1);
        Instant startTime = now.minus(1, ChronoUnit.HOURS).truncatedTo(ChronoUnit.HOURS);

        aggregateLogsInTimeRange(startTime, endTime);
    }

    public void aggregateLogsInTimeRange(Instant startTime, Instant endTime) {
        log.info("Starting aggregation for period: {} to {}", startTime, endTime);

        try {
            // Fetch raw logs from hea-backend
            String url = String.format("%s/api/v1/health/traces/raw?startTime=%s&endTime=%s",
                    healthServiceUrl, startTime.toString(), endTime.toString());
            
            @SuppressWarnings("null")
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            List<Map<String, Object>> logs = response.getBody();
            if (logs == null || logs.isEmpty()) {
                log.info("No logs found for the aggregation period: {} to {}", startTime, endTime);
                return;
            }

            log.info("Fetched {} logs for aggregation.", logs.size());

            // Fetch metrics logs for CPU percentile
            String metricsUrl = String.format("%s/api/v1/health/metrics/raw?startTime=%s&endTime=%s",
                    healthServiceUrl, startTime.toString(), endTime.toString());
            @SuppressWarnings("null")
            ResponseEntity<List<Map<String, Object>>> metricsResponse = restTemplate.exchange(
                    metricsUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            List<Map<String, Object>> metricsLogs = metricsResponse.getBody();
            if (metricsLogs == null) metricsLogs = new ArrayList<>();

            List<Map<String, Object>> summaries = aggregateLogs(logs, metricsLogs, startTime);
            log.info("Aggregated into {} buckets (5-min).", summaries.size());
            
            if (!summaries.isEmpty()) {
                log.info("Sending {} summaries to health service at: {}/api/v1/health/traces/summary", summaries.size(), healthServiceUrl);
                restTemplate.postForObject(healthServiceUrl + "/api/v1/health/traces/summary", summaries, Void.class);
                log.info("Successfully sent aggregated summaries.");
            }
        } catch (Exception e) {
            log.error("Failed to aggregate monitoring logs", e);
            throw e;
        }
    }

    private List<Map<String, Object>> aggregateLogs(List<Map<String, Object>> logs, List<Map<String, Object>> metricsLogs, Instant startTime) {
        List<Map<String, Object>> summaries = new ArrayList<>();
        
        for (int i = 0; i < 12; i++) {
            Instant bucketStart = startTime.plus(i * 5, ChronoUnit.MINUTES);
            Instant bucketEnd = bucketStart.plus(5, ChronoUnit.MINUTES);
            
            List<Map<String, Object>> logsInBucket = logs.stream()
                    .filter(l -> {
                        String tsStr = (String) l.get("timestamp");
                        if (tsStr == null) return false;
                        Instant ts = Instant.parse(tsStr);
                        return !ts.isBefore(bucketStart) && ts.isBefore(bucketEnd);
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> metricsInBucket = metricsLogs.stream()
                    .filter(l -> {
                        String tsStr = (String) l.get("timestamp");
                        if (tsStr == null) return false;
                        Instant ts = Instant.parse(tsStr);
                        return !ts.isBefore(bucketStart) && ts.isBefore(bucketEnd);
                    })
                    .collect(Collectors.toList());

            if (logsInBucket.isEmpty()) continue;

            log.debug("Processing bucket: {} with {} logs and {} metrics", bucketStart, logsInBucket.size(), metricsInBucket.size());

            // Group metrics by appId to calculate CPU percentiles
            Map<String, List<Double>> cpuByApp = metricsInBucket.stream()
                    .filter(m -> m.get("appId") != null && m.get("cpuUsage") != null)
                    .collect(Collectors.groupingBy(
                            m -> (String) m.get("appId"),
                            Collectors.mapping(m -> ((Number) m.get("cpuUsage")).doubleValue(), Collectors.toList())
                    ));

            // Group logs by appId, serviceName, methodName
            Map<String, List<Map<String, Object>>> grouped = logsInBucket.stream()
                    .collect(Collectors.groupingBy(l -> 
                        l.get("appId") + "|" + l.get("serviceName") + "|" + l.get("methodName")
                    ));

            for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
                List<Map<String, Object>> groupLogs = entry.getValue();
                String[] keys = entry.getKey().split("\\|");
                String appId = keys[0];
                
                long count = groupLogs.size();
                long minDuration = groupLogs.stream().mapToLong(l -> ((Number) l.get("duration")).longValue()).min().orElse(0);
                long maxDuration = groupLogs.stream().mapToLong(l -> ((Number) l.get("duration")).longValue()).max().orElse(0);
                double avgDuration = groupLogs.stream().mapToLong(l -> ((Number) l.get("duration")).longValue()).average().orElse(0.0);
                long totalDuration = groupLogs.stream().mapToLong(l -> ((Number) l.get("duration")).longValue()).sum();
                
                double minUsedMem = groupLogs.stream().mapToDouble(l -> ((Number) l.get("usedMemory")).doubleValue()).min().orElse(0.0);
                double maxUsedMem = groupLogs.stream().mapToDouble(l -> ((Number) l.get("usedMemory")).doubleValue()).max().orElse(0.0);
                double avgUsedMem = groupLogs.stream().mapToDouble(l -> ((Number) l.get("usedMemory")).doubleValue()).average().orElse(0.0);
                double totalUsedMem = groupLogs.stream().mapToDouble(l -> ((Number) l.get("usedMemory")).doubleValue()).sum();

                // Calculate CPU percentiles for this appId
                List<Double> cpuValues = cpuByApp.getOrDefault(appId, new ArrayList<>());
                double cpuP95 = calculatePercentile(cpuValues, 95);
                double cpuP50 = calculatePercentile(cpuValues, 50);

                Map<String, Object> maxLog = groupLogs.stream().max(Comparator.comparingLong(l -> ((Number) l.get("duration")).longValue())).get();
                
                Map<String, Object> summary = new HashMap<>();
                summary.put("bucketTime", bucketStart.toString());
                summary.put("appId", appId);
                summary.put("serviceName", keys[1]);
                summary.put("methodName", keys[2]);
                summary.put("minDuration", minDuration);
                summary.put("maxDuration", maxDuration);
                summary.put("avgDuration", avgDuration);
                summary.put("totalDuration", totalDuration);
                summary.put("minUsedMemory", minUsedMem);
                summary.put("maxUsedMemory", maxUsedMem);
                summary.put("avgUsedMemory", avgUsedMem);
                summary.put("totalUsedMemory", totalUsedMem);
                summary.put("cpuP95", cpuP95);
                summary.put("cpuP50", cpuP50);
                summary.put("totalCounts", count);
                summary.put("representativeSql", maxLog.get("query"));
                summary.put("lastExecuteTime", maxLog.get("timestamp"));
                
                summaries.add(summary);
            }
        }
        return summaries;
    }

    private double calculatePercentile(List<Double> values, double percentile) {
        if (values == null || values.isEmpty()) return 0.0;
        List<Double> sorted = new ArrayList<>(values);
        Collections.sort(sorted);
        int index = (int) Math.ceil(percentile / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
    }
}
