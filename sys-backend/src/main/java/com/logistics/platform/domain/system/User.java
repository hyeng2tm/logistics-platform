package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_sys_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "department")
    private String department;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "status")
    private String status;

    @Column(name = "language", length = 10, nullable = false)
    private String language = "ko";
}
