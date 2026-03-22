package com.logistics.batch.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "t_sys_metrics_logs", indexes = {
    @Index(name = "idx_metrics_app_time", columnList = "app_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMetricsLog {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "app_id", length = 50)
    private String appId;

    @Column(name = "cpu_usage")
    private Double cpuUsage;

    @Column(name = "memory_usage")
    private Double memoryUsage;

    @Column(name = "latency")
    private Double latency;

    @Column(name = "tps")
    private Double tps;

    @Column(name = "error_rate")
    private Double errorRate;
}
