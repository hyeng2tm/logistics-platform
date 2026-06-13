package com.logistics.health.repository;

import com.logistics.health.domain.DatabaseMetricsLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface DatabaseMetricsLogRepository extends JpaRepository<DatabaseMetricsLog, String> {
    List<DatabaseMetricsLog> findTop1440ByOrderByTimestampDesc();
    List<DatabaseMetricsLog> findByTimestampBetween(Instant start, Instant end);
}
