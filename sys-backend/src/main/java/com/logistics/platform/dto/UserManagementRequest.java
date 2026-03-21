package com.logistics.platform.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserManagementRequest {
    // User Profile fields (t_sys_users)
    private String id; // 사번/ID
    private String username;
    private String name;
    private String department;
    private String roleId;
    private LocalDateTime lastLogin;
    private String status;
    private String language;

    // Auth fields (t_sys_user_auth)
    private String email;
    private String password;
}
