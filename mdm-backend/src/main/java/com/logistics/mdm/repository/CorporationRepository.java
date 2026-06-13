package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Corporation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorporationRepository extends JpaRepository<Corporation, Long> {
    List<Corporation> findByNameContaining(String name);
}
