package com.logistics.platform.aspect;

import com.logistics.platform.dto.system.ExecutionLog;
import com.logistics.platform.service.system.SystemMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class MonitoringTraceAspect {

    private final SystemMonitoringService systemMonitoringService;

    @Pointcut("within(com.logistics.platform.service..*) && !execution(* com.logistics.platform.service.system.SystemMonitoringService.addExecutionLog(..))")
    public void serviceLayer() {}

    @Around("serviceLayer()")
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
            
            // Simulated Query based on method name for demonstration
            String simulatedQuery = getSimulatedQuery(methodName);
            
            ExecutionLog executionLog = ExecutionLog.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .methodName(methodName)
                .duration(duration)
                .usedMemory(afterUsedMem)
                .totalMemory(afterTotalMem)
                .query(simulatedQuery)
                .status(status)
                .build();
            
            systemMonitoringService.addExecutionLog(executionLog);
        }
        
        return result;
    }

    private String getSimulatedQuery(String methodName) {
        if (methodName.startsWith("find") || methodName.startsWith("get") || methodName.startsWith("search")) {
            return "SELECT * FROM " + methodName.replaceFirst("^(find|get|search)", "").toLowerCase() + " WHERE ...";
        } else if (methodName.startsWith("save") || methodName.startsWith("create") || methodName.startsWith("add")) {
            return "INSERT INTO " + methodName.replaceFirst("^(save|create|add)", "").toLowerCase() + " (...) VALUES (...)";
        } else if (methodName.startsWith("update") || methodName.startsWith("modify")) {
            return "UPDATE " + methodName.replaceFirst("^(update|modify)", "").toLowerCase() + " SET ... WHERE ...";
        } else if (methodName.startsWith("delete") || methodName.startsWith("remove")) {
            return "DELETE FROM " + methodName.replaceFirst("^(delete|remove)", "").toLowerCase() + " WHERE ...";
        }
        return "N/A (Business Logic)";
    }
}
