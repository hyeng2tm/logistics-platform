package com.logistics.platform.config.database;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Routing DataSource that determines whether to use the master or slave database
 * based on the read-only flag of the current Spring transaction.
 * Supports multiple slaves with Round-Robin load balancing.
 */
public class ReplicationRoutingDataSource extends AbstractRoutingDataSource {

    private List<String> slaveKeys;
    private final AtomicInteger counter = new AtomicInteger(0);
    private Map<Object, Object> dataSourceMap;

    @Override
    public void setTargetDataSources(@org.springframework.lang.NonNull Map<Object, Object> targetDataSources) {
        super.setTargetDataSources(targetDataSources);
        this.dataSourceMap = targetDataSources;
    }

    public Map<Object, Object> getDataSourceMap() {
        return dataSourceMap;
    }

    public void setSlaveKeys(List<String> slaveKeys) {
        this.slaveKeys = slaveKeys;
    }

    @Override
    protected Object determineCurrentLookupKey() {
        // 1. Explicitly set via @Master or @Slave annotation
        String dataSourceType = DataSourceContextHolder.getDataSourceType();
        if (dataSourceType != null) {
            return dataSourceType;
        }

        // 2. Logic for Read-Only transactions
        if (TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            if (slaveKeys != null && !slaveKeys.isEmpty()) {
                int index = Math.abs(counter.getAndIncrement() % slaveKeys.size());
                return slaveKeys.get(index);
            }
            return "slave"; // Default fallback
        }

        // 3. Default to Master for write transactions
        return "master";
    }
}
