package com.logistics.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
@org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.context.annotation.EnableAspectJAutoProxy
public class LogisticsPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogisticsPlatformApplication.class, args);
    }
}
