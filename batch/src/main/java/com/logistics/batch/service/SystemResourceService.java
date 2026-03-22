package com.logistics.batch.service;

import com.logistics.batch.domain.SystemMetricsLog;
import com.logistics.batch.repository.SystemMetricsLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemResourceService {

    @Value("${spring.application.name:batch-service}")
    private String appId;

    private final SystemMetricsLogRepository systemMetricsLogRepository;

    @Transactional
    public void recordResources() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double systemLoad = osBean.getSystemLoadAverage();
        
        double cpuUsage = (systemLoad < 0) ? 1.5 : systemLoad; 

        long totalMemory = Runtime.getRuntime().totalMemory();
        long freeMemory = Runtime.getRuntime().freeMemory();
        double memoryUsage = ((double) (totalMemory - freeMemory) / totalMemory) * 100.0;

        SystemMetricsLog logEntity = SystemMetricsLog.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(Instant.now())
                .appId(appId)
                .cpuUsage(cpuUsage)
                .memoryUsage(memoryUsage)
                .latency(0.0)
                .tps(0.0)
                .errorRate(0.0)
                .build();

        if (logEntity != null) {
            systemMetricsLogRepository.save(logEntity);
        }
        log.info("Batch App (Service): Recorded System Resources -> CPU (Load): {}, Memory Usage: {}%", 
            String.format("%.2f", cpuUsage), 
            String.format("%.2f", memoryUsage));
    }
}
