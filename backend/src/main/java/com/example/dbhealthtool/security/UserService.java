package com.example.dbhealthtool.security;

import com.example.dbhealthtool.config.DatabaseConnection;

import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    /** A user confirmed to exist is trusted for this long (saves a DB query per request). */
    private static final long CACHE_MILLIS = 60_000;

    private final Map<Integer, Long> knownUsers = new ConcurrentHashMap<>();

    public boolean exists(int userId) {
        if (userId <= 0) {
            return false;
        }

        long now = System.currentTimeMillis();
        Long seen = knownUsers.get(userId);
        if (seen != null && now - seen < CACHE_MILLIS) {
            return true;
        }

        try (Connection conn = DatabaseConnection.getToolConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT 1 FROM users WHERE id = ?")) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    knownUsers.put(userId, now);
                    return true;
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        knownUsers.remove(userId);
        return false;
    }
}
