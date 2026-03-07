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
public class MenuResponse {
    private Long id;
    private Long parentId;
    private String title; // i18n key
    private Map<String, String> translations;
    private String path;
    private String icon;
    private Integer sortOrder;
    private String isVisible;
}
