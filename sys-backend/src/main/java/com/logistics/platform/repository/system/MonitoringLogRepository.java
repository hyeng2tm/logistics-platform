package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.MonitoringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitoringLogRepository extends JpaRepository<MonitoringLog, String> {
    List<MonitoringLog> findTop500ByOrderByTimestampDesc();
}
