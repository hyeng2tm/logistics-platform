package com.logistics.health.repository;

import com.logistics.health.domain.SystemMetricsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface SystemMetricsLogRepository extends JpaRepository<SystemMetricsLog, String> {
    List<SystemMetricsLog> findTop1440ByOrderByTimestampDesc();
    List<SystemMetricsLog> findTop10ByAppIdOrderByTimestampDesc(String appId);
    List<SystemMetricsLog> findByTimestampBetween(Instant start, Instant end);
}
