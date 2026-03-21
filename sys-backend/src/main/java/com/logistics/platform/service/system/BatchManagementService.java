package com.logistics.platform.service.system;

import com.logistics.platform.dto.system.BatchJobDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchManagementService {

    private final Scheduler scheduler;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<BatchJobDto> getAllJobs() {
        List<BatchJobDto> jobList = new ArrayList<>();
        try {
            for (String groupName : scheduler.getJobGroupNames()) {
                for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                    // Fetch description directly from DB to avoid ClassNotFoundException when loading JobDetail
                    String description = "";
                    try {
                        description = jdbcTemplate.queryForObject(
                            "SELECT DESCRIPTION FROM QRTZ_JOB_DETAILS WHERE SCHED_NAME = ? AND JOB_NAME = ? AND JOB_GROUP = ?",
                            String.class,
                            scheduler.getSchedulerName(),
                            jobKey.getName(),
                            jobKey.getGroup()
                        );
                    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                        description = "";
                    }

                    List<? extends Trigger> triggers = scheduler.getTriggersOfJob(jobKey);

                    for (Trigger trigger : triggers) {
                        Trigger.TriggerState triggerState = scheduler.getTriggerState(trigger.getKey());
                        String cronExpression = "";
                        if (trigger instanceof CronTrigger) {
                            cronExpression = ((CronTrigger) trigger).getCronExpression();
                        }

                        jobList.add(BatchJobDto.builder()
                                .jobName(jobKey.getName())
                                .jobGroup(jobKey.getGroup())
                                .description(description)
                                .cronExpression(cronExpression)
                                .state(triggerState.name())
                                .nextFireTime(formatDate(trigger.getNextFireTime()))
                                .previousFireTime(formatDate(trigger.getPreviousFireTime()))
                                .build());
                    }
                }
            }
        } catch (SchedulerException e) {
            log.error("Failed to fetch quartz jobs", e);
            throw new RuntimeException("Failed to list batch jobs", e);
        }
        return jobList;
    }

    public void pauseJob(String jobGroup, String jobName) {
        try {
            scheduler.pauseJob(new JobKey(jobName, jobGroup));
            log.info("Paused job: {}.{}", jobGroup, jobName);
        } catch (SchedulerException e) {
            throw new RuntimeException("Failed to pause job", e);
        }
    }

    public void resumeJob(String jobGroup, String jobName) {
        try {
            scheduler.resumeJob(new JobKey(jobName, jobGroup));
            log.info("Resumed job: {}.{}", jobGroup, jobName);
        } catch (SchedulerException e) {
            throw new RuntimeException("Failed to resume job", e);
        }
    }

    public void updateCronExpression(String jobGroup, String jobName, String cronExpression) {
        try {
            JobKey jobKey = new JobKey(jobName, jobGroup);
            List<? extends Trigger> triggers = scheduler.getTriggersOfJob(jobKey);

            if (triggers != null && !triggers.isEmpty()) {
                // Assuming one trigger per job for simplicity
                Trigger oldTrigger = triggers.get(0);
                Trigger newTrigger = TriggerBuilder.newTrigger()
                        .withIdentity(oldTrigger.getKey())
                        .withDescription(oldTrigger.getDescription())
                        .forJob(jobKey)
                        .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                        .build();

                scheduler.rescheduleJob(oldTrigger.getKey(), newTrigger);
                log.info("Updated trigger {} cron to {}", oldTrigger.getKey(), cronExpression);
            }
        } catch (SchedulerException e) {
            throw new RuntimeException("Failed to update cron expression", e);
        }
    }

    private String formatDate(Date date) {
        if (date == null) return null;
        return date.toInstant().atZone(ZoneId.systemDefault()).format(formatter);
    }
}
