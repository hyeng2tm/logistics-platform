package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByUsername(String username);
}
