package com.logistics.auth.config.database.aop;

import com.logistics.auth.config.database.DataSourceContextHolder;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DataSourceAspect {

    @Around("@annotation(com.logistics.auth.config.database.annotation.Master) || @within(com.logistics.auth.config.database.annotation.Master)")
    public Object routeToMaster(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            DataSourceContextHolder.setDataSourceType("master");
            return joinPoint.proceed();
        } finally {
            DataSourceContextHolder.clearDataSourceType();
        }
    }

    @Around("@annotation(com.logistics.auth.config.database.annotation.Slave) || @within(com.logistics.auth.config.database.annotation.Slave)")
    public Object routeToSlave(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            DataSourceContextHolder.setDataSourceType("slave");
            return joinPoint.proceed();
        } finally {
            DataSourceContextHolder.clearDataSourceType();
        }
    }
}
