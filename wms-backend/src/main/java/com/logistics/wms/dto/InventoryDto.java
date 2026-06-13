package com.logistics.wms.dto;

import lombok.*;
import java.time.LocalDateTime;

public class InventoryDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdjustRequest {
        private Long warehouseId;
        private Long locationId;
        private String itemCode;
        private String itemName;
        private Integer qty;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long warehouseId;
        private Long locationId;
        private String itemCode;
        private String itemName;
        private Integer qty;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoryResponse {
        private Long id;
        private Long warehouseId;
        private Long locationId;
        private String itemCode;
        private Integer qtyChange;
        private String type; // INBOUND, OUTBOUND, ADJUSTMENT
        private String referenceNo;
        private LocalDateTime createdAt;
    }
}
