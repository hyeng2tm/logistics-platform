package com.logistics.batch.aspect;

import com.logistics.batch.domain.MonitoringLog;
import com.logistics.batch.repository.MonitoringLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class MonitoringTraceAspect {

    @Value("${spring.application.name:batch-service}")
    private String appId;

    private final MonitoringLogRepository monitoringLogRepository;

    @Pointcut("within(com.logistics.batch.job..*)")
    public void batchLayer() {}

    @Around("batchLayer()")
    public Object traceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Runtime runtime = Runtime.getRuntime();
        
        String methodName = joinPoint.getSignature().getName();
        String serviceName = joinPoint.getTarget().getClass().getSimpleName();
        
        Object result;
        String status = "Success";
        try {
            result = joinPoint.proceed();
        } catch (Throwable e) {
            status = "Error: " + e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - start;
            long afterTotalMem = runtime.totalMemory() / (1024 * 1024);
            long afterUsedMem = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
            
            MonitoringLog logEntry = MonitoringLog.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(Instant.now())
                .appId(appId)
                .serviceName("Batch: " + serviceName)
                .methodName(methodName)
                .duration(duration)
                .usedMemory(afterUsedMem)
                .totalMemory(afterTotalMem)
                .query("N/A (Batch Job)")
                .status(status)
                .build();
            
            if (logEntry != null) {
                monitoringLogRepository.save(logEntry);
            }
        }
        
        return result;
    }
}
