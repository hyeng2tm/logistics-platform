package com.logistics.platform.config.database;

import com.logistics.platform.config.AppProperties;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;

import javax.sql.DataSource;
import java.util.HashMap;
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
     * Creates the Slave DataSource bean using properties from AppProperties.
     */
    @Bean
    public DataSource slaveDataSource(AppProperties appProperties) {
        return appProperties.getDatasource().getSlave()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * Creates the routing data source containing both master and slave.
     */
    @Bean
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") @org.springframework.lang.NonNull DataSource masterDataSource,
            @Qualifier("slaveDataSource") @org.springframework.lang.NonNull DataSource slaveDataSource) {

        ReplicationRoutingDataSource routingDataSource = new ReplicationRoutingDataSource();

        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(MASTER, masterDataSource);
        dataSourceMap.put(SLAVE, slaveDataSource);

        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(masterDataSource);

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
