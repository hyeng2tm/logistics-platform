package com.logistics.platform.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class DataSourceConfigProperties {

    @NestedConfigurationProperty
    private DataSourceProperties master = new DataSourceProperties();

    @NestedConfigurationProperty
    private List<DataSourceProperties> slaves = new ArrayList<>();
}
