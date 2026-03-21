package com.logistics.batch.job;

import com.logistics.batch.domain.SystemResourceLog;
import com.logistics.batch.repository.SystemResourceLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemResourceJob extends QuartzJobBean {

    private final SystemResourceLogRepository systemResourceLogRepository;

    @Override
    @Transactional
    protected void executeInternal(@org.springframework.lang.NonNull JobExecutionContext context) throws JobExecutionException {
        try {
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            double systemLoad = osBean.getSystemLoadAverage();
            
            double cpuUsage = (systemLoad < 0) ? 1.5 : systemLoad; 

            long totalMemory = Runtime.getRuntime().totalMemory();
            long freeMemory = Runtime.getRuntime().freeMemory();
            double memoryUsage = ((double) (totalMemory - freeMemory) / totalMemory) * 100.0;

            SystemResourceLog logEntity = new SystemResourceLog();
            logEntity.setCpuUsage(cpuUsage);
            logEntity.setMemoryUsage(memoryUsage);
            logEntity.setRecordedAt(LocalDateTime.now());

            systemResourceLogRepository.save(logEntity);
            log.info("Batch App (Quartz): Recorded System Resources -> CPU (Load): {}, Memory Usage: {}%", 
                String.format("%.2f", cpuUsage), 
                String.format("%.2f", memoryUsage));
                
        } catch (Exception e) {
            log.error("Batch App (Quartz): Failed to record system resources", e);
            throw new JobExecutionException(e);
        }
    }
}
