package com.logistics.platform.config;

import lombok.Data;
import java.util.List;

@Data
public class CorsProperties {
    private List<String> allowedOrigins;
}
