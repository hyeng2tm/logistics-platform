package com.logistics.platform.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String name;
    private String department;
    private String roleId;
    private LocalDateTime lastLogin;
    private String status;
    private String email;
    private String language;
}
