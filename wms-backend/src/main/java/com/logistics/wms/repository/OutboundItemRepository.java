package com.logistics.wms.repository;

import com.logistics.wms.domain.OutboundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboundItemRepository extends JpaRepository<OutboundItem, Long> {
    List<OutboundItem> findByOutboundId(Long outboundId);
}
