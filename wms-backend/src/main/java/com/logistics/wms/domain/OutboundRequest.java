package com.logistics.wms.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "t_dom_outbounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "outbound_no", nullable = false, unique = true, length = 50)
    private String outboundNo;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // REQUESTED, PICKING, PACKING, SHIPPED, CANCELLED

    @Column(name = "outbound_date", nullable = false)
    private LocalDate outboundDate;
}
