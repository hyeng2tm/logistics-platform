package com.logistics.auth.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.filter.ForwardedHeaderFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final AppProperties appProperties;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        /**
         * nginx 등의 프록시 뒤에서 X-Forwarded-* 헤더를 신뢰하도록 설정
         * 이를 통해 auth-server가 올바른 호스트/프로토콜 정보를 사용하여 리다이렉트 URL을 생성
         */
        @Bean
        public ForwardedHeaderFilter forwardedHeaderFilter() {
                return new ForwardedHeaderFilter();
        }

        @Bean
        @Order(2)
        public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(org.springframework.security.config.Customizer.withDefaults())
                                .csrf(csrf -> csrf.ignoringRequestMatchers("/login", "/oauth2/**"))
                                .authorizeHttpRequests(authorize -> authorize
                                                .requestMatchers("/css/**", "/images/**", "/js/**").permitAll()
                                                .requestMatchers("/oauth2/**", "/login", "/logout").permitAll()
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/do-logout") // 기존 필터와 충돌 방지
                                                .logoutSuccessUrl(appProperties.getOauth2()
                                                                .getPostLogoutRedirectUris() != null
                                                                && !appProperties.getOauth2()
                                                                                .getPostLogoutRedirectUris().isEmpty()
                                                                                                ? appProperties.getOauth2()
                                                                                                                .getPostLogoutRedirectUris()
                                                                                                                .get(0)
                                                                                                : "/")
                                                .permitAll());

                return http.build();
        }
}
