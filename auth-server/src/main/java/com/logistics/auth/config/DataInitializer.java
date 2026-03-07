package com.logistics.auth.config;

import com.logistics.auth.entity.User;
import com.logistics.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "admin@logistics.com",
                    "ROLE_ADMIN");
            User user = new User(
                    "user",
                    passwordEncoder.encode("user123"),
                    "user@logistics.com",
                    "ROLE_USER");
            userRepository.save(admin);
            userRepository.save(user);
            log.info("Default users created: admin / admin123, user / user123");
        }
    }
}
