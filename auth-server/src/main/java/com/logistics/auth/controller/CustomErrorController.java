package com.logistics.auth.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    @ResponseBody
    public Object handleError(HttpServletRequest request) {
        String requestUri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        // 브라우저 특성 요청(chrome-devtools, favicon 등)에 대해 204 No Content 반환하여 로그 노이즈 감소
        if (requestUri != null
                && (requestUri.contains("com.chrome.devtools.json") || requestUri.contains("favicon.ico"))) {
            return ResponseEntity.noContent().build();
        }

        Map<String, Object> errorDetails = new LinkedHashMap<>();

        Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String errorMessage = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Throwable exception = (Throwable) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        errorDetails.put("status", statusCode != null ? statusCode : HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorDetails.put("uri", requestUri);
        errorDetails.put("message", errorMessage);
        errorDetails.put("exception", exception != null ? exception.getMessage() : null);
        errorDetails.put("cause",
                exception != null && exception.getCause() != null ? exception.getCause().getMessage() : null);

        return errorDetails;
    }
}
