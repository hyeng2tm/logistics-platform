package com.logistics.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetailCodeResponse {
    private Long id;
    private String masterCodeId;
    private String code;
    private String label;
    private Integer sortOrder;
    private String useYn;
    private Map<String, String> translations;
}
