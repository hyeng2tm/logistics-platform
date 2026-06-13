package com.logistics.wms.repository;

import com.logistics.wms.domain.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByWarehouseIdAndLocationIdAndItemCode(Long warehouseId, Long locationId, String itemCode);
    List<Inventory> findByWarehouseId(Long warehouseId);
    List<Inventory> findByWarehouseIdAndLocationId(Long warehouseId, Long locationId);
    List<Inventory> findByItemCode(String itemCode);
}
