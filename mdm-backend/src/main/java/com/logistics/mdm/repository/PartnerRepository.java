package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Partner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartnerRepository extends JpaRepository<Partner, Long> {
    List<Partner> findByNameContaining(String name);
}
