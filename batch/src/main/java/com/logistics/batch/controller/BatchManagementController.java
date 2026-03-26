package com.logistics.batch.controller;

import com.logistics.batch.dto.BatchJobDto;
import com.logistics.batch.service.BatchManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/{jobGroup}/{jobName}/run")
    public ResponseEntity<Void> runJob(
            @PathVariable String jobGroup, 
            @PathVariable String jobName,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime) {
        batchManagementService.runJob(jobGroup, jobName, startTime, endTime);
        return ResponseEntity.ok().build();
    }
}
