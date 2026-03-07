package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_sys_detail_code_translations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetailCodeTranslation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_code_id")
    private DetailCode detailCode;

    @Column(name = "lang_code", nullable = false, length = 10)
    private String langCode;

    @Column(name = "label", nullable = false)
    private String label;
}
