package com.logistics.wms.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_dom_inventory_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;

    @Column(name = "qty_change", nullable = false)
    private Integer qtyChange;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // INBOUND, OUTBOUND, ADJUSTMENT

    @Column(name = "reference_no", length = 50)
    private String referenceNo;
}
