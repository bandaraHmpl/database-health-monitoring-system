package com.example.dbhealthtool.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public final class CreateDatabaseIfNotExists {

    private CreateDatabaseIfNotExists() {
    }

    public static void create(
            String host,
            String port,
            String dbName,
            String username,
            String password
    ) throws Exception {

        String sanitized = dbName.replace("`", "");
        String url = "jdbc:mysql://"
                + host
                + ":"
                + port
                + "/?useSSL=false&allowPublicKeyRetrieval=true";

        try (Connection conn = DriverManager.getConnection(url, username, password);
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate(
                    "CREATE DATABASE IF NOT EXISTS `"
                            + sanitized
                            + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            );

            System.out.println("Ensured database exists: " + sanitized);
        }
    }
}
