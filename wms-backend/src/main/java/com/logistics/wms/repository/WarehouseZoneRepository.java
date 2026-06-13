package com.logistics.wms.repository;

import com.logistics.wms.domain.WarehouseZone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseZoneRepository extends JpaRepository<WarehouseZone, Long> {
    List<WarehouseZone> findByWarehouseId(Long warehouseId);
}
