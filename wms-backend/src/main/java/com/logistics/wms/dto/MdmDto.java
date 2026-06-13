package com.logistics.wms.dto;

import lombok.Data;

public class MdmDto {

    @Data
    public static class Warehouse {
        private Long id;
        private String code;
        private String name;
        private Long corporationId;
        private String type;
        private String address;
        private String useYn;
    }

    @Data
    public static class Customer {
        private Long id;
        private String code;
        private String name;
        private String businessNumber;
        private String contact;
        private String address;
        private String useYn;
    }

    @Data
    public static class Partner {
        private Long id;
        private String code;
        private String name;
        private String businessNumber;
        private String contact;
        private String address;
        private String useYn;
    }
}
