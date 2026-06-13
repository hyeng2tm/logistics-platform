package com.logistics.wms.repository;

import com.logistics.wms.domain.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, Long> {
    List<WarehouseLocation> findByZoneId(Long zoneId);
}
