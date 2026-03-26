package com.logistics.batch.config;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    @NestedConfigurationProperty
    private HealthServiceProperties healthService = new HealthServiceProperties();
}
