package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Corporation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorporationRepository extends JpaRepository<Corporation, Long> {
    List<Corporation> findByNameContaining(String name);
}
