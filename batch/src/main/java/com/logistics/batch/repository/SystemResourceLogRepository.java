package com.logistics.batch.repository;

import com.logistics.batch.domain.SystemResourceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemResourceLogRepository extends JpaRepository<SystemResourceLog, Long> {
}
