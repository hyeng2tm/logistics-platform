package com.logistics.batch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemResourceService {

    @Value("${spring.application.name:batch-service}")
    private String appId;

    @Value("${app.health-service.url:http://hea-backend:8081}")
    private String healthServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void recordResources() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double systemLoad = osBean.getSystemLoadAverage();
        
        double cpuUsage = (systemLoad < 0) ? 1.5 : systemLoad; 

        long totalMemory = Runtime.getRuntime().totalMemory();
        long freeMemory = Runtime.getRuntime().freeMemory();
        double memoryUsage = ((double) (totalMemory - freeMemory) / totalMemory) * 100.0;

        Map<String, Object> metrics = Map.of(
            "id", UUID.randomUUID().toString(),
            "timestamp", Instant.now().toString(),
            "appId", appId,
            "cpuUsage", cpuUsage,
            "memoryUsage", memoryUsage,
            "latency", 0.0,
            "tps", 0.0,
            "errorRate", 0.0
        );

        try {
            restTemplate.postForObject(healthServiceUrl + "/api/v1/health/metrics", metrics, Void.class);
            log.info("Batch App: Sent resources to health service -> CPU: {}, Memory: {}%", 
                String.format("%.2f", cpuUsage), String.format("%.2f", memoryUsage));
        } catch (Exception e) {
            log.error("Failed to send metrics to health service: {}", e.getMessage());
        }
    }
}
