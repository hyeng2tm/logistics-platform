package com.logistics.wms.repository;

import com.logistics.wms.domain.InboundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InboundItemRepository extends JpaRepository<InboundItem, Long> {
    List<InboundItem> findByInboundId(Long inboundId);
}
