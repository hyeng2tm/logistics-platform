package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, String> {
}
