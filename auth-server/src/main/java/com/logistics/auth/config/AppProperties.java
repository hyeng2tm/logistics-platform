package com.logistics.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import org.springframework.stereotype.Component;

import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String frontendUrl;
    private Keystore keystore = new Keystore();
    private Cors cors = new Cors();
    private Oauth2 oauth2 = new Oauth2();

    @Getter
    @Setter
    public static class Keystore {
        private String alias;
        private String path;
        private String password;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins;
    }

    @Getter
    @Setter
    public static class Oauth2 {
        private String issuerUri;
        private List<String> redirectUris;
        private List<String> postLogoutRedirectUris;
    }
}
