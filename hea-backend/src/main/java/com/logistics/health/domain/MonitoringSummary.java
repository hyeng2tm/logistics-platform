package com.logistics.health.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "t_monitoring_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoringSummary {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "bucket_time")
    private Instant bucketTime;

    @Column(name = "app_id", length = 50)
    private String appId;

    @Column(name = "service_name", length = 100)
    private String serviceName;

    @Column(name = "method_name", length = 100)
    private String methodName;

    @Column(name = "min_duration")
    private Long minDuration;

    @Column(name = "max_duration")
    private Long maxDuration;

    @Column(name = "avg_duration")
    private Double avgDuration;

    @Column(name = "total_duration")
    private Long totalDuration;

    @Column(name = "min_used_memory")
    private Double minUsedMemory;

    @Column(name = "max_used_memory")
    private Double maxUsedMemory;

    @Column(name = "avg_used_memory")
    private Double avgUsedMemory;

    @Column(name = "total_used_memory")
    private Double totalUsedMemory;

    @Column(name = "cpu_p95")
    private Double cpuP95;

    @Column(name = "cpu_p50")
    private Double cpuP50;

    @Column(name = "total_counts")
    private Long totalCounts;

    @Column(name = "representative_sql", length = 500)
    private String representativeSql;

    @Column(name = "last_execute_time")
    private Instant lastExecuteTime;
}
