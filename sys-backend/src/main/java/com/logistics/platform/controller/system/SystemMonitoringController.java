package com.logistics.platform.controller.system;

import com.logistics.platform.dto.system.ExecutionLog;
import com.logistics.platform.service.system.SystemMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/monitoring")
@RequiredArgsConstructor
public class SystemMonitoringController {

    private final SystemMonitoringService monitoringService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(monitoringService.getSystemSummary());
    }

    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getLogs() {
        return ResponseEntity.ok(monitoringService.getSystemLogs());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        return ResponseEntity.ok(monitoringService.getHistory());
    }

    @GetMapping("/execution-logs")
    public ResponseEntity<List<ExecutionLog>> getExecutionLogs() {
        return ResponseEntity.ok(monitoringService.getExecutionLogs());
    }
}
