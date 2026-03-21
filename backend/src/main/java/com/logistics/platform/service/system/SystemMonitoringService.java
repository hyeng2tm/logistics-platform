package com.logistics.platform.service.system;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@Slf4j
public class SystemMonitoringService {

    private final Random random = new Random();

    public Map<String, Object> getSystemSummary() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double systemLoad = osBean.getSystemLoadAverage();
        
        return Map.of(
            "systemLoad", systemLoad < 0 ? 1.5 : systemLoad,
            "memoryUsage", 45 + random.nextInt(30), // mock %
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }

    public List<Map<String, Object>> getSystemLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        String[] events = {
            "User generated a new report.",
            "Vehicle V-104 changed status to In-Transit.",
            "Database backup completed successfully.",
            "API Rate limit warning for client APP-01",
            "Failed login attempt from IP 192.168.1.100"
        };
        String[] levels = {"INFO", "INFO", "INFO", "WARN", "ERROR"};

        for (int i = 0; i < 15; i++) {
            int idx = random.nextInt(events.length);
            logs.add(Map.of(
                "id", 1000 - i,
                "timestamp", LocalDateTime.now().minusMinutes(i * 15L).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "level", levels[idx],
                "message", events[idx]
            ));
        }
        return logs;
    }
}
