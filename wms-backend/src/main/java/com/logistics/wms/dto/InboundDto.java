package com.logistics.wms.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

public class InboundDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long warehouseId;
        private Long customerId;
        private Long partnerId;
        private LocalDate inboundDate;
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
    public static class ReceiveRequest {
        private List<ItemReceiveRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemReceiveRequest {
        private Long itemId;
        private Integer qtyReceived;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PutawayRequest {
        private List<ItemPutawayRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemPutawayRequest {
        private Long itemId;
        private Long locationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String inboundNo;
        private Long warehouseId;
        private Long customerId;
        private Long partnerId;
        private String status;
        private LocalDate inboundDate;
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
        private Integer qtyReceived;
        private Long locationId;
    }
}
