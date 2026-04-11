package com.logistics.platform.config.database;

import com.logistics.platform.config.AppProperties;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class DataSourceConfig {

    private static final String MASTER = "master";
    private static final String SLAVE = "slave";

    /**
     * Creates the Master DataSource bean using properties from AppProperties.
     */
    @Bean
    public DataSource masterDataSource(AppProperties appProperties) {
        return appProperties.getDatasource().getMaster()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * Creates the routing data source containing master and all configured slaves.
     */
    @Bean
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource masterDataSource,
            AppProperties appProperties) {

        ReplicationRoutingDataSource routingDataSource = new ReplicationRoutingDataSource();
        Map<Object, Object> dataSourceMap = new HashMap<>();
        
        // Add master
        dataSourceMap.put(MASTER, masterDataSource);
        
        // Add all slaves
        List<org.springframework.boot.autoconfigure.jdbc.DataSourceProperties> slaveConfigs = appProperties.getDatasource().getSlaves();
        List<String> slaveKeys = new ArrayList<>();
        for (int i = 0; i < slaveConfigs.size(); i++) {
            DataSource slaveDs = slaveConfigs.get(i)
                    .initializeDataSourceBuilder()
                    .type(HikariDataSource.class)
                    .build();
            String key = SLAVE + (i + 1);
            dataSourceMap.put(key, slaveDs);
            slaveKeys.add(key);
        }
        
        // Fallback for backward compatibility or if list is empty
        if (slaveConfigs.isEmpty()) {
            dataSourceMap.put(SLAVE, masterDataSource); // or a default slave
            slaveKeys.add(SLAVE);
        }

        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(java.util.Objects.requireNonNull(masterDataSource));
        routingDataSource.setSlaveKeys(slaveKeys);

        return routingDataSource;
    }

    /**
     * Defers the actual acquisition of the DB connection until the first SQL statement is executed.
     * This is strictly required for the AbstractRoutingDataSource to correctly evaluate the 
     * @Transactional(readOnly=true/false) context before the connection is fetched from the pool.
     */
    @Bean
    @Primary
    public DataSource dataSource(@Qualifier("routingDataSource") @org.springframework.lang.NonNull DataSource routingDataSource) {
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}
