package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_sys_monitoring_logs")
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
    private LocalDateTime timestamp;

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
