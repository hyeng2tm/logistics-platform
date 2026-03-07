package com.logistics.auth.config;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * KeyStore 저장을 위한 자체 서명(Self-Signed) X.509 인증서 생성 유틸리티.
 * BouncyCastle 라이브러리를 사용합니다.
 */
public class SelfSignedCertGenerator {

    private SelfSignedCertGenerator() {
    }

    /**
     * 자체 서명 X.509 인증서를 생성합니다.
     *
     * @param keyPair      RSA 키 쌍
     * @param algorithm    서명 알고리즘 (예: "SHA256withRSA")
     * @param commonName   인증서 CN (예: "auth-server")
     * @param validityDays 유효 기간 (일)
     * @return 자체 서명된 X509Certificate
     */
    public static X509Certificate generate(KeyPair keyPair, String algorithm,
            String commonName, int validityDays) throws Exception {
        Instant notBefore = Instant.now();
        Instant notAfter = notBefore.plus(validityDays, ChronoUnit.DAYS);

        X500Name subject = new X500Name("CN=" + commonName);
        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());

        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                subject,
                serial,
                Date.from(notBefore),
                Date.from(notAfter),
                subject,
                keyPair.getPublic());

        ContentSigner signer = new JcaContentSignerBuilder(algorithm)
                .build(keyPair.getPrivate());

        return new JcaX509CertificateConverter()
                .getCertificate(certBuilder.build(signer));
    }
}
