package com.logistics.platform.dto.system;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionLog {
    private String id;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private String serviceName;
    private String methodName;
    private long duration; // ms
    private double usedMemory; // MB
    private double totalMemory; // MB
    private String query;
    private String status; // Success / Error
}
