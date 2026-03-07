package com.logistics.auth.config;

import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;

public class PublicClientRefreshTokenGeneratorCustomizer implements OAuth2TokenCustomizer<OAuth2TokenContext> {
    @Override
    public void customize(OAuth2TokenContext context) {
        // By default, DefaultOAuth2TokenContext's registeredClient getClientAuthenticationMethods
        // is checked. We just pass through, as the RefreshTokenGenerator already generated the token.
    }
}
