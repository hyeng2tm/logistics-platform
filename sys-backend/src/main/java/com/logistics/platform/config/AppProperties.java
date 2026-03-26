package com.logistics.platform.config;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@Data
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String version;

    @NestedConfigurationProperty
    private CorsProperties cors = new CorsProperties();

    @NestedConfigurationProperty
    private HealthServiceProperties healthService = new HealthServiceProperties();

    @NestedConfigurationProperty
    private CrossingProperties crossing = new CrossingProperties();

    @NestedConfigurationProperty
    private DataSourceConfigProperties datasource = new DataSourceConfigProperties();
}
