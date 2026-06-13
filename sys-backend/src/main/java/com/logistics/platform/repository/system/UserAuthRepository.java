package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, Long> {
    Optional<UserAuth> findByUsername(String username);

    void deleteByUsername(String username);
}
