package com.logistics.platform;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.junit.jupiter.api.Test;

public class JasyptDecryptTest {
    @Test
    public void decryptUsernameAndPassword() {
        String secretKey = "logistics-master-secret-key";
        String encUsername = "HToHXFcSRhGi7geBlfHXcg==";
        String encPassword = "HbNqI2+UilXKYeT6IuL0jKOaLKPMd+pK";

        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(secretKey);
        encryptor.setAlgorithm("PBEWithMD5AndDES");
        // StandardPBEStringEncryptor에는 setIvGeneratorClassName이 없음 (iv-generator는 사용하지 않음)
        // StandardPBEStringEncryptor에는 setSaltGeneratorClassName도 없음 (기본 salt generator 사용)

        try {
            String username = encryptor.decrypt(encUsername);
            String password = encryptor.decrypt(encPassword);
            System.out.println("username: " + username);
            System.out.println("password: " + password);
        } catch (Exception e) {
            System.out.println("복호화 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
