package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.FavoriteMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMenuRepository extends JpaRepository<FavoriteMenu, Long> {
    List<FavoriteMenu> findByUserId(String userId);

    Optional<FavoriteMenu> findByUserIdAndMenuId(String userId, Long menuId);

    void deleteByUserIdAndMenuId(String userId, Long menuId);

    void deleteByUserId(String userId);
}
