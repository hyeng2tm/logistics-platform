package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.DetailCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetailCodeRepository extends JpaRepository<DetailCode, Long> {
    List<DetailCode> findByMasterCodeIdOrderBySortOrderAsc(String masterCodeId);

    java.util.Optional<DetailCode> findByMasterCodeIdAndCode(String masterCodeId, String code);
}
