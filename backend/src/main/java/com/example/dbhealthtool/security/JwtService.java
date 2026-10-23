package com.example.dbhealthtool.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal HS256 JWT issuer/verifier with no extra dependencies.
 * Payload: {"sub":"<userId>","iat":<epoch>,"exp":<epoch>}
 *
 * Secret comes from JWT_SECRET (see application.properties). If it is not
 * set, a random secret is generated at startup: everything still works but
 * all tokens become invalid when the server restarts.
 */
@Service
public class JwtService {

    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Pattern SUB = Pattern.compile("\"sub\":\"(\\d+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] key;
    private final long expirySeconds;
    private final String encodedHeader = B64.encodeToString(HEADER_JSON.getBytes(StandardCharsets.UTF_8));

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiry-minutes:480}") long expiryMinutes
    ) {
        if (secret == null || secret.isBlank()) {
            byte[] random = new byte[48];
            new SecureRandom().nextBytes(random);
            this.key = random;
            System.out.println("WARNING: JWT_SECRET is not set. Using a random secret; "
                    + "all logins will be invalidated on restart.");
        } else {
            if (secret.length() < 32) {
                throw new IllegalStateException("JWT_SECRET must be at least 32 characters long");
            }
            this.key = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.expirySeconds = expiryMinutes * 60;
    }

    public String issue(int userId) {
        long now = Instant.now().getEpochSecond();
        String payload = "{\"sub\":\"" + userId + "\",\"iat\":" + now
                + ",\"exp\":" + (now + expirySeconds) + "}";
        String signingInput = encodedHeader + "."
                + B64.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return signingInput + "." + B64.encodeToString(hmac(signingInput));
    }

    /** @return the userId, or -1 if the token is invalid or expired. */
    public int verify(String token) {
        try {
            if (token == null) return -1;
            String[] parts = token.split("\\.");
            if (parts.length != 3) return -1;

            // Only accept exactly our header (blocks alg=none / alg confusion)
            if (!encodedHeader.equals(parts[0])) return -1;

            byte[] expected = hmac(parts[0] + "." + parts[1]);
            byte[] actual = B64D.decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) return -1;

            String payload = new String(B64D.decode(parts[1]), StandardCharsets.UTF_8);

            Matcher exp = EXP.matcher(payload);
            if (!exp.find() || Long.parseLong(exp.group(1)) < Instant.now().getEpochSecond()) {
                return -1;
            }

            Matcher sub = SUB.matcher(payload);
            if (!sub.find()) return -1;
            return Integer.parseInt(sub.group(1));
        } catch (Exception e) {
            return -1;
        }
    }

    private byte[] hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }
}
