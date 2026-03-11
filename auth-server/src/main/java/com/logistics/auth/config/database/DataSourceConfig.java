package com.logistics.auth.config.database;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
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

    @org.springframework.context.annotation.Configuration
    @ConfigurationProperties(prefix = "spring.datasource.master")
    public static class MasterDataSourceProperties extends com.zaxxer.hikari.HikariConfig {}

    @org.springframework.context.annotation.Configuration
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    public static class SlaveDataSourceProperties extends com.zaxxer.hikari.HikariConfig {}

    /**
     * Creates the Master DataSource bean reading properties from spring.datasource.master.*
     */
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.master")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().type(com.zaxxer.hikari.HikariDataSource.class).build();
    }

    /**
     * Creates the Slave DataSource bean reading properties from spring.datasource.slave.*
     */
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    public DataSource slaveDataSource() {
        return DataSourceBuilder.create().type(com.zaxxer.hikari.HikariDataSource.class).build();
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
