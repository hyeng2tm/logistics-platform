package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByNameContaining(String name);
}
