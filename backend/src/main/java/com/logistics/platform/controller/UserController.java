package com.logistics.platform.controller;

import com.logistics.platform.dto.UserResponse;
import com.logistics.platform.service.system.SystemAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final SystemAdminService systemAdminService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        // Typically the 'sub' claim is the username or ID
        String username = jwt.getSubject();
        return ResponseEntity.ok(systemAdminService.getUserByUsername(username));
    }
}
