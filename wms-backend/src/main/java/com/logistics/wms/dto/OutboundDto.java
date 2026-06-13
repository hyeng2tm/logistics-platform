package com.logistics.wms.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

public class OutboundDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long warehouseId;
        private Long customerId;
        private Long partnerId;
        private LocalDate outboundDate;
        private List<ItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemRequest {
        private String itemCode;
        private String itemName;
        private Integer qtyRequested;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PickRequest {
        private List<ItemPickRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemPickRequest {
        private Long itemId;
        private Integer qtyPicked;
        private Long locationId; // The location picking from
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String outboundNo;
        private Long warehouseId;
        private Long customerId;
        private Long partnerId;
        private String status;
        private LocalDate outboundDate;
        private List<ItemResponse> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private Long id;
        private String itemCode;
        private String itemName;
        private Integer qtyRequested;
        private Integer qtyShipped;
    }
}
