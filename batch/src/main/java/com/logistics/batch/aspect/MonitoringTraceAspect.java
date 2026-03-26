package com.logistics.batch.aspect;

import com.logistics.batch.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.UUID;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class MonitoringTraceAspect {

    @Value("${spring.application.name:batch-service}")
    private String appId;

    private final AppProperties appProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    @Pointcut("(within(com.logistics.batch.job..*) || within(com.logistics.batch.service..*)) && !within(com.logistics.batch.service.BatchManagementService)")
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
            
            Map<String, Object> traceRequest = Map.of(
                "id", UUID.randomUUID().toString(),
                "timestamp", Instant.now(),
                "appId", appId,
                "serviceName", "Batch: " + serviceName,
                "methodName", methodName,
                "duration", duration,
                "usedMemory", (double) afterUsedMem,
                "totalMemory", (double) afterTotalMem,
                "query", "N/A (Batch Job)",
                "status", status
            );
            
            try {
                String url = appProperties.getHealthService().getUrl();
                if (url == null || url.isEmpty()) {
                    url = "http://hea-backend:8081"; // Fallback
                }
                log.debug("Sending batch trace to health service at: {}/api/v1/health/traces", url);
                restTemplate.postForObject(url + "/api/v1/health/traces", traceRequest, Void.class);
            } catch (Exception e) {
                log.warn("Failed to send batch trace to health service: {}", e.getMessage());
            }
        }
        
        return result;
    }
}
