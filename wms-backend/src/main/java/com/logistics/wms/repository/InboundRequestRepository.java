package com.logistics.wms.repository;

import com.logistics.wms.domain.InboundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InboundRequestRepository extends JpaRepository<InboundRequest, Long> {
    Optional<InboundRequest> findByInboundNo(String inboundNo);
    List<InboundRequest> findByWarehouseId(Long warehouseId);
}
