package com.logistics.health.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "t_monitoring_logs")
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
    private Long duration;

    @Column(name = "used_memory")
    private Double usedMemory;

    @Column(name = "total_memory")
    private Double totalMemory;

    @Column(name = "query", length = 500)
    private String query;

    @Column(name = "status", length = 20)
    private String status;
}
