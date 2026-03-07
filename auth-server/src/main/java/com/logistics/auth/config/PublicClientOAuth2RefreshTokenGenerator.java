package com.logistics.auth.config;

import org.springframework.lang.Nullable;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

public final class PublicClientOAuth2RefreshTokenGenerator implements OAuth2TokenGenerator<OAuth2RefreshToken> {
    private final StringKeyGenerator refreshTokenGenerator = new Base64StringKeyGenerator(
            Base64.getUrlEncoder().withoutPadding(), 96);

    @Nullable
    @Override
    public OAuth2RefreshToken generate(OAuth2TokenContext context) {
        if (!OAuth2TokenType.REFRESH_TOKEN.equals(context.getTokenType())) {
            return null;
        }

        // We intentionally REMOVE the
        // `isPublicClientForAuthorizationCodeGrant(context)` check
        // that exists in the default OAuth2RefreshTokenGenerator, to allow public
        // clients
        // to receive refresh tokens.

        Instant issuedAt = Instant.now();
        Duration refreshTokenTimeToLive = context.getRegisteredClient().getTokenSettings().getRefreshTokenTimeToLive();
        Instant expiresAt = issuedAt.plus(refreshTokenTimeToLive);
        return new OAuth2RefreshToken(this.refreshTokenGenerator.generateKey(), issuedAt, expiresAt);
    }
}
