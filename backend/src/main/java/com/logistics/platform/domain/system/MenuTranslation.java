package com.logistics.platform.domain.system;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "t_sys_menu_translations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuTranslation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    @JsonIgnore
    private Menu menu;

    @Column(name = "lang_code", nullable = false, length = 10)
    private String langCode;

    @Column(name = "title", nullable = false)
    private String title;
}
