package com.logistics.platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.logistics.platform.service.system.SystemAdminService;
import lombok.RequiredArgsConstructor;
import java.io.PrintWriter;
import java.io.StringWriter;

@RestController
@RequiredArgsConstructor
public class TestController {
    
    private final SystemAdminService systemAdminService;

    @GetMapping("/api/test-error")
    public String testError() {
        try {
            systemAdminService.toggleFavorite("admin", 1L);
            return "SUCCESS";
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            return sw.toString();
        }
    }
}
