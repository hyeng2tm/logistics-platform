package com.logistics.platform.config.database;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Routing DataSource that determines whether to use the master or slave database
 * based on the read-only flag of the current Spring transaction.
 */
public class ReplicationRoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        // 1. Explicitly set via @Master or @Slave annotation
        String dataSourceType = DataSourceContextHolder.getDataSourceType();
        if (dataSourceType != null) {
            return dataSourceType;
        }

        // 2. Fallback to Spring's transaction read-only flag
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                ? "slave"
                : "master";
    }
}
