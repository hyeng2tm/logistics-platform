package com.logistics.auth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.DelegatingOAuth2TokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class AuthorizationServerConfig {

    private final AppProperties appProperties;

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
                .tokenGenerator(tokenGenerator(jwkSource(), tokenCustomizer()))
                .clientAuthentication(clientAuth -> clientAuth
                        .authenticationConverters(
                                converters -> converters.add(new PublicClientRefreshTokenAuthenticationConverter()))
                        .authenticationProviders(providers -> providers
                                .add(new PublicClientRefreshTokenAuthenticationProvider(registeredClientRepository()))))
                .oidc(Customizer.withDefaults()); // Enable OpenID Connect 1.0

        http
                // Allow CORS for the authorization server endpoints
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.ignoringRequestMatchers("/oauth2/token"))
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)))
                // Configure RequestCache
                .requestCache(cache -> cache
                        .requestCache(new org.springframework.security.web.savedrequest.HttpSessionRequestCache()));

        return http.build();
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient logisticsFrontend = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("logistics-frontend")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUris(uris -> uris.addAll(appProperties.getOauth2().getRedirectUris()))
                .postLogoutRedirectUris(uris -> uris.addAll(appProperties.getOauth2().getPostLogoutRedirectUris()))
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .scope("offline_access")
                .scope("read")
                .scope("write")
                .clientSettings(ClientSettings.builder()
                        .requireAuthorizationConsent(false)
                        .requireProofKey(true) // PKCE 필수
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofHours(1))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .reuseRefreshTokens(false)
                        .build())
                .build();

        return new InMemoryRegisteredClientRepository(logisticsFrontend);
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        RSAKey rsaKey = loadOrGenerateRsaKey();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    private RSAKey loadOrGenerateRsaKey() {
        File keystoreFile = new File(appProperties.getKeystore().getPath());
        File keysDir = keystoreFile.getParentFile();
        if (keysDir != null && !keysDir.exists()) {
            keysDir.mkdirs();
        }
        if (keystoreFile.exists()) {
            return loadRsaKeyFromKeyStore(keystoreFile);
        } else {
            return generateAndSaveRsaKey(keystoreFile);
        }
    }

    private RSAKey loadRsaKeyFromKeyStore(File keystoreFile) {
        try {
            KeyStore keyStore = KeyStore.getInstance("JKS");
            try (FileInputStream fis = new FileInputStream(keystoreFile)) {
                keyStore.load(fis, appProperties.getKeystore().getPassword().toCharArray());
            }
            java.security.PrivateKey privateKey = (java.security.PrivateKey) keyStore.getKey(
                    appProperties.getKeystore().getAlias(),
                    appProperties.getKeystore().getPassword().toCharArray());
            Certificate cert = keyStore.getCertificate(appProperties.getKeystore().getAlias());
            RSAPublicKey publicKey = (RSAPublicKey) cert.getPublicKey();
            String keyId = appProperties.getKeystore().getAlias();
            return new RSAKey.Builder(publicKey)
                    .privateKey((RSAPrivateKey) privateKey)
                    .keyID(keyId)
                    .build();
        } catch (Exception e) {
            return generateAndSaveRsaKey(new File(appProperties.getKeystore().getPath()));
        }
    }

    private RSAKey generateAndSaveRsaKey(File keystoreFile) {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
            RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
            String keyId = UUID.randomUUID().toString();
            X509Certificate selfSignedCert = SelfSignedCertGenerator.generate(keyPair, "SHA256withRSA", "auth-server",
                    3650);
            KeyStore keyStore = KeyStore.getInstance("JKS");
            keyStore.load(null, appProperties.getKeystore().getPassword().toCharArray());
            keyStore.setKeyEntry(
                    appProperties.getKeystore().getAlias(),
                    privateKey,
                    appProperties.getKeystore().getPassword().toCharArray(),
                    new Certificate[] { selfSignedCert });
            try (FileOutputStream fos = new FileOutputStream(keystoreFile)) {
                keyStore.store(fos, appProperties.getKeystore().getPassword().toCharArray());
            }
            return new RSAKey.Builder(publicKey)
                    .privateKey(privateKey)
                    .keyID(keyId)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("[KeyStore] Failed to generate and save RSA key", e);
        }
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer(appProperties.getOauth2().getIssuerUri())
                .build();
    }

    @Bean
    public OAuth2TokenCustomizer<org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext> tokenCustomizer() {
        return context -> {
            if (context.getTokenType().getValue().equals("access_token")) {
                if (context.getAuthorizedScopes().contains("offline_access")) {
                    context.getClaims().claim("scope", String.join(" ", context.getAuthorizedScopes()));
                }
            }
        };
    }

    @Bean
    public OAuth2TokenGenerator<?> tokenGenerator(JWKSource<SecurityContext> jwkSource,
            OAuth2TokenCustomizer<org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext> tokenCustomizer) {
        JwtGenerator jwtGenerator = new JwtGenerator(
                new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(jwkSource));
        jwtGenerator.setJwtCustomizer(tokenCustomizer);

        PublicClientOAuth2RefreshTokenGenerator refreshTokenGenerator = new PublicClientOAuth2RefreshTokenGenerator();

        return new DelegatingOAuth2TokenGenerator(jwtGenerator, refreshTokenGenerator);
    }
}
