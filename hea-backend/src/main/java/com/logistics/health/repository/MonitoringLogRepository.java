package com.logistics.health.repository;

import com.logistics.health.domain.MonitoringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface MonitoringLogRepository extends JpaRepository<MonitoringLog, String> {
    List<MonitoringLog> findTop1440ByOrderByTimestampDesc();
    List<MonitoringLog> findByTimestampBetween(Instant start, Instant end);
}
