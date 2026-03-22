package com.logistics.batch.repository;

import com.logistics.batch.domain.SystemMetricsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemMetricsLogRepository extends JpaRepository<SystemMetricsLog, String> {
    List<SystemMetricsLog> findTop10ByAppIdOrderByTimestampDesc(String appId);
}
