package com.logistics.platform.service.system;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class SystemMonitoringServiceTest {

    private SystemMonitoringService service;

    @BeforeEach
    void setUp() {
        service = new SystemMonitoringService(new SimpleMeterRegistry());
    }

    @Test
    @SuppressWarnings("unchecked")
    void testGetSystemSummary() {
        Map<String, Object> summary = service.getSystemSummary();
        
        assertNotNull(summary);
        assertTrue(summary.containsKey("sysBackend"));
        assertTrue(summary.containsKey("dbServer"));
        assertTrue(summary.containsKey("timestamp"));
        
        Map<String, Object> backend = (Map<String, Object>) summary.get("sysBackend");
        assertTrue(backend.containsKey("cpu"));
        assertTrue(backend.containsKey("memory"));
        assertTrue(backend.containsKey("status"));
        
        Map<String, Object> dbServer = (Map<String, Object>) summary.get("dbServer");
        assertTrue(dbServer.containsKey("cpu"));
        assertTrue(dbServer.containsKey("memory"));
        assertTrue(dbServer.containsKey("status"));
    }
}
