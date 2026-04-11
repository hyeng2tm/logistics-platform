package com.logistics.health.repository;

import com.logistics.health.domain.DatabaseMetricsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface DatabaseMetricsLogRepository extends JpaRepository<DatabaseMetricsLog, String> {
    List<DatabaseMetricsLog> findTop1440ByOrderByTimestampDesc();
    List<DatabaseMetricsLog> findByTimestampBetween(Instant start, Instant end);
}
