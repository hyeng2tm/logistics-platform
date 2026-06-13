package com.logistics.wms.dto;

import lombok.*;
import java.util.List;

public class LayoutDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ZoneRequest {
        private Long warehouseId;
        private String code;
        private String name;
        private String type;
        private String useYn;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationRequest {
        private Long zoneId;
        private String code;
        private String rack;
        private String row;
        private String level;
        private String useYn;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ZoneResponse {
        private Long id;
        private Long warehouseId;
        private String code;
        private String name;
        private String type;
        private String useYn;
        private List<LocationResponse> locations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationResponse {
        private Long id;
        private Long zoneId;
        private String code;
        private String rack;
        private String row;
        private String level;
        private String useYn;
    }
}
