package com.logistics.batch.config;

import com.logistics.batch.job.MonitoringAggregationJob;
import com.logistics.batch.job.SystemResourceJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    public static final String JOB_NAME = "SystemResourceJob";
    public static final String JOB_GROUP = "SystemMonitoring";
    public static final String CRON_EXPRESSION = "0 * * * * ?"; // Every 1 minute

    @Bean
    public JobDetail systemResourceJobDetail() {
        return JobBuilder.newJob(SystemResourceJob.class)
                .withIdentity(JOB_NAME, JOB_GROUP)
                .withDescription("Records CPU and Memory usages of the system every minute")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger systemResourceJobTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(systemResourceJobDetail())
                .withIdentity(JOB_NAME + "Trigger", JOB_GROUP)
                .withDescription("Trigger for SystemResourceJob")
                .withSchedule(CronScheduleBuilder.cronSchedule(CRON_EXPRESSION))
                .build();
    }

    @Bean
    public JobDetail monitoringAggregationJobDetail() {
        return JobBuilder.newJob(MonitoringAggregationJob.class)
                .withIdentity("MonitoringAggregationJob", "MonitoringGroup")
                .withDescription("Aggregates execution logs every hour")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger monitoringAggregationJobTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(monitoringAggregationJobDetail())
                .withIdentity("MonitoringAggregationTrigger", "MonitoringGroup")
                .withDescription("Trigger for MonitoringAggregationJob")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 5 * * * ?")) // Every hour at 5 minutes past
                .build();
    }
}
