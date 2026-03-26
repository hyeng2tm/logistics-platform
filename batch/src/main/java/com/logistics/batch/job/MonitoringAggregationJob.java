package com.logistics.batch.job;

import com.logistics.batch.service.MonitoringAggregationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MonitoringAggregationJob implements Job {

    private final MonitoringAggregationService aggregationService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("Executing MonitoringAggregationJob...");
        
        String startTimeStr = context.getMergedJobDataMap().getString("startTime");
        String endTimeStr = context.getMergedJobDataMap().getString("endTime");

        if (startTimeStr != null && endTimeStr != null) {
            log.info("Manual execution for period: {} to {}", startTimeStr, endTimeStr);
            try {
                aggregationService.aggregateLogsInTimeRange(
                    java.time.Instant.parse(startTimeStr), 
                    java.time.Instant.parse(endTimeStr)
                );
            } catch (Exception e) {
                log.error("Failed manual aggregation", e);
                throw new JobExecutionException(e);
            }
        } else {
            aggregationService.aggregatePreviousHourLogs();
        }
        
        log.info("MonitoringAggregationJob completed.");
    }
}
