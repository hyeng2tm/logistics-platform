package com.logistics.platform;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Properties;

public class JasyptConfigTest {

    @Test
    public void generateEncryptedStrings() {
        // 주의: 운영 환경 암호화를 위해 backend/src/test/resources/jasypt-secrets.properties 파일을
        // 생성하고
        // master.password=운영-마스터-비밀번호
        // db.username=운영-DB-사용자명
        // db.password=운영-DB-비밀번호
        // 위와 같이 입력한 후 이 테스트를 실행하세요. (해당 properties 파일은 .gitignore에 의해 커밋되지 않습니다)

        Properties props = new Properties();
        try (InputStream in = getClass().getResourceAsStream("/jasypt-secrets.properties")) {
            if (in == null) {
                System.out.println("resources/jasypt-secrets.properties 파일을 찾을 수 없습니다. (콘솔에 임시 텍스트가 암호화됩니다)");
                props.setProperty("master.password", "CHANGE_ME_MASTER_KEY");
                props.setProperty("db.username", "CHANGE_ME_USERNAME");
                props.setProperty("db.password", "CHANGE_ME_PASSWORD");
            } else {
                props.load(in);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(props.getProperty("master.password", ""));
        encryptor.setAlgorithm("PBEWithMD5AndDES");

        System.out.println("----------------------------------------");
        System.out.println("USER_ENC: ENC(" + encryptor.encrypt(props.getProperty("db.username", "")) + ")");
        System.out.println("PASS_ENC: ENC(" + encryptor.encrypt(props.getProperty("db.password", "")) + ")");
        System.out.println("----------------------------------------");
    }
}
