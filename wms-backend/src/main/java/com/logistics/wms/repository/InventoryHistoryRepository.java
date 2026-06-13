package com.logistics.wms.repository;

import com.logistics.wms.domain.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {
    List<InventoryHistory> findByWarehouseId(Long warehouseId);
    List<InventoryHistory> findByItemCode(String itemCode);
}
