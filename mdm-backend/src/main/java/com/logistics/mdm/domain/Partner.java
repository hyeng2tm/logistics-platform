package com.logistics.mdm.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "t_mdm_partners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "business_number", length = 50)
    private String businessNumber;

    @Column(name = "type", length = 50)
    private String type; // e.g. 배송, 운송, 하역

    @Column(name = "contact", length = 50)
    private String contact;

    @Column(name = "use_yn", length = 1)
    private String useYn; // Y, N
}
