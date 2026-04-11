package com.logistics.health.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "t_db_metrics_logs", indexes = {
    @Index(name = "idx_db_metrics_app_type_time", columnList = "app_id, db_type, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabaseMetricsLog {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "app_id", length = 50)
    private String appId;

    @Column(name = "db_type", length = 20) // master, slave
    private String dbType;

    @Column(name = "active_connections")
    private Integer activeConnections;

    @Column(name = "idle_connections")
    private Integer idleConnections;

    @Column(name = "total_connections")
    private Integer totalConnections;

    @Column(name = "threads_awaiting_connection")
    private Integer threadsAwaitingConnection;
    
    @Column(name = "status", length = 20) // UP, DOWN
    private String status;

    @Column(name = "cpu_usage")
    private Double cpuUsage;

    @Column(name = "memory_usage")
    private Double memoryUsage;
}
