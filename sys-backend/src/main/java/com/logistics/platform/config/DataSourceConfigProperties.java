package com.logistics.platform.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@Getter
@Setter
public class DataSourceConfigProperties {

    @NestedConfigurationProperty
    private DataSourceProperties master = new DataSourceProperties();

    @NestedConfigurationProperty
    private DataSourceProperties slave = new DataSourceProperties();
}
