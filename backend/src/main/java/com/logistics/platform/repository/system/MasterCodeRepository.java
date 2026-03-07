package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.MasterCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MasterCodeRepository extends JpaRepository<MasterCode, String> {
}
