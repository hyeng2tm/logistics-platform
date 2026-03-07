package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByUsername(String username);
}
