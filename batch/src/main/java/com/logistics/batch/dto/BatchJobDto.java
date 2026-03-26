package com.logistics.batch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchJobDto {
    private String jobName;
    private String jobGroup;
    private String description;
    private String cronExpression;
    private String state; // NORMAL, PAUSED, ERROR, etc
    private String nextFireTime;
    private String previousFireTime;
}
