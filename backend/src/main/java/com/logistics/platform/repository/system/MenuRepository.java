package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    java.util.Optional<Menu> findByTitle(String title);

    List<Menu> findAllByOrderByParentIdAscSortOrderAsc();
}
