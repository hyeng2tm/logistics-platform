package com.logistics.platform.controller.system;

import com.logistics.platform.dto.system.BatchJobDto;
import com.logistics.platform.service.system.BatchManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/batch/jobs")
@RequiredArgsConstructor
public class BatchManagementController {

    private final BatchManagementService batchManagementService;

    @GetMapping
    public ResponseEntity<List<BatchJobDto>> getAllJobs() {
        return ResponseEntity.ok(batchManagementService.getAllJobs());
    }

    @PostMapping("/{jobGroup}/{jobName}/pause")
    public ResponseEntity<Void> pauseJob(@PathVariable String jobGroup, @PathVariable String jobName) {
        batchManagementService.pauseJob(jobGroup, jobName);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{jobGroup}/{jobName}/resume")
    public ResponseEntity<Void> resumeJob(@PathVariable String jobGroup, @PathVariable String jobName) {
        batchManagementService.resumeJob(jobGroup, jobName);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{jobGroup}/{jobName}/cron")
    public ResponseEntity<Void> updateCron(@PathVariable String jobGroup, @PathVariable String jobName, @RequestBody Map<String, String> payload) {
        String cron = payload.get("cronExpression");
        batchManagementService.updateCronExpression(jobGroup, jobName, cron);
        return ResponseEntity.ok().build();
    }
}
