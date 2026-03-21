package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.SystemMetricsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemMetricsLogRepository extends JpaRepository<SystemMetricsLog, Long> {
    List<SystemMetricsLog> findTop288ByOrderByTimestampDesc(); // Last 24 hours (assuming 5min interval)
}
