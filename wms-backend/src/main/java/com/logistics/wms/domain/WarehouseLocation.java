package com.logistics.wms.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_dom_warehouse_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseLocation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "rack", length = 50)
    private String rack;

    @Column(name = "row", length = 50)
    private String row;

    @Column(name = "level", length = 50)
    private String level;

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn; // Y, N
}
