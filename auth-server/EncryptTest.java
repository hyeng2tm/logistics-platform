import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.iv.RandomIvGenerator;

public class EncryptTest {
    public static void main(String[] args) {
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword("logistics-master-secret-key");
        encryptor.setAlgorithm("PBEWithMD5AndDES");
        encryptor.setIvGenerator(new RandomIvGenerator());
        System.out.println("user: ENC(" + encryptor.encrypt("user") + ")");
        System.out.println("password: ENC(" + encryptor.encrypt("password") + ")");
    }
}
