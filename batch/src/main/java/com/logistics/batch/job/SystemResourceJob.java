package com.logistics.batch.job;

import com.logistics.batch.service.SystemResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemResourceJob extends QuartzJobBean {

    private final SystemResourceService systemResourceService;

    @Override
    @Transactional
    protected void executeInternal(@org.springframework.lang.NonNull JobExecutionContext context) throws JobExecutionException {
        try {
            systemResourceService.recordResources();
        } catch (Exception e) {
            log.error("Batch App (Quartz): Failed to record system resources", e);
            throw new JobExecutionException(e);
        }
    }
}
