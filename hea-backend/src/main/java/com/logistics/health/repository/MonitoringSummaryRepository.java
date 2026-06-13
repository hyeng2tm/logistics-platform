package com.logistics.health.repository;

import com.logistics.health.domain.MonitoringSummary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonitoringSummaryRepository extends JpaRepository<MonitoringSummary, String> {
}
