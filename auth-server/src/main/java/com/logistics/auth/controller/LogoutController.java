package com.logistics.auth.controller;

import com.logistics.auth.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class LogoutController {

    private final AppProperties appProperties;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    @GetMapping("/logout")
    public String logout(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        if (authentication != null) {
            this.logoutHandler.logout(request, response, authentication);
        }

        String redirectUri = request.getParameter("post_logout_redirect_uri");
        List<String> allowedUris = appProperties.getOauth2().getPostLogoutRedirectUris();

        // 검증: 요청된 URI가 허용된 목록에 있는지 확인
        if (redirectUri == null || allowedUris == null || !allowedUris.contains(redirectUri)) {
            // 목록이 비어있지 않다면 첫 번째 항목을 기본값으로 사용, 아니면 절대 경로 기본값
            redirectUri = (allowedUris != null && !allowedUris.isEmpty())
                    ? allowedUris.get(0)
                    : "/"; // Final fallback to root
        }

        return "redirect:" + redirectUri;
    }
}
