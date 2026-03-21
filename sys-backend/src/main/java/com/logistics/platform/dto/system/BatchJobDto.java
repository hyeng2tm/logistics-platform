package com.logistics.platform.dto.system;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BatchJobDto {
    private String jobName;
    private String jobGroup;
    private String description;
    private String cronExpression;
    private String state; // NORMAL, PAUSED, ERROR, etc
    private String nextFireTime;
    private String previousFireTime;
}
