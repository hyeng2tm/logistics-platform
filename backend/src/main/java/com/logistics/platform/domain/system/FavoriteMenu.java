package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_sys_favorite_menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteMenu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;
}
