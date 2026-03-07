package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "t_sys_menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId; // null이면 최상위 메뉴

    @Column(name = "title", nullable = false)
    private String title; // i18n key

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<MenuTranslation> translations = new ArrayList<>();

    @Column(name = "path")
    private String path;

    @Column(name = "icon")
    private String icon;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_visible", length = 1)
    private String isVisible; // 'Y' or 'N'
}
