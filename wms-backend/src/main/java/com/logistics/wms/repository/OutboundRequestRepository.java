package com.logistics.wms.repository;

import com.logistics.wms.domain.OutboundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OutboundRequestRepository extends JpaRepository<OutboundRequest, Long> {
    Optional<OutboundRequest> findByOutboundNo(String outboundNo);
    List<OutboundRequest> findByWarehouseId(Long warehouseId);
}
