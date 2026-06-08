package com.logistics.mdm.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "t_mdm_mappings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corporation_id", nullable = false)
    private Long corporationId;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId; // System User ID (e.g. USR-042)

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "use_yn", length = 1)
    private String useYn; // Y, N
}
