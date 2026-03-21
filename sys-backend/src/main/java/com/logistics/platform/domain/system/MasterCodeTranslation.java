package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_sys_master_code_translations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterCodeTranslation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_code_id")
    private MasterCode masterCode;

    @Column(name = "lang_code", nullable = false, length = 10)
    private String langCode;

    @Column(name = "name", nullable = false)
    private String name;
}
