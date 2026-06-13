package com.logistics.platform.repository.system;

import com.logistics.platform.domain.system.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Optional<Message> findByMessageKey(String messageKey);
}
