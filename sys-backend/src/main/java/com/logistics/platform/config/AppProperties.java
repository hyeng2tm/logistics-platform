package com.logistics.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String version;
    private Cors cors = new Cors();

    @Data
    public static class Cors {
        private List<String> allowedOrigins;
    }
}
