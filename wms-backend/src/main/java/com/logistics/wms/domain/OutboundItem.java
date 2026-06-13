package com.logistics.wms.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_dom_outbound_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "outbound_id", nullable = false)
    private Long outboundId;

    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "qty_requested", nullable = false)
    private Integer qtyRequested;

    @Column(name = "qty_shipped", nullable = false)
    private Integer qtyShipped;
}
