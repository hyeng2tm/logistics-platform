package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    java.util.List<Menu> findByMenuKey(String menuKey);

    List<Menu> findAllByOrderByParentIdAscSortOrderAsc();
}
