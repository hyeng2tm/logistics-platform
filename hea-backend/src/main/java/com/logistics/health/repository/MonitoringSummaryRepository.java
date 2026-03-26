package com.logistics.health.repository;

import com.logistics.health.domain.MonitoringSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitoringSummaryRepository extends JpaRepository<MonitoringSummary, String> {
}
