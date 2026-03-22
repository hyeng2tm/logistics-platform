package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "t_sys_monitoring_logs", indexes = {
    @Index(name = "idx_monitor_app_time", columnList = "app_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoringLog {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "app_id", length = 50)
    private String appId;

    @Column(name = "service_name", length = 100)
    private String serviceName;

    @Column(name = "method_name", length = 100)
    private String methodName;

    @Column(name = "duration")
    private long duration;

    @Column(name = "used_memory")
    private double usedMemory;

    @Column(name = "total_memory")
    private double totalMemory;

    @Column(name = "query", columnDefinition = "TEXT")
    private String query;

    @Column(name = "status", length = 50)
    private String status;
}
