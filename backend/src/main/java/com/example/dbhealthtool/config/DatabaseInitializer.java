package com.example.dbhealthtool.config;

import com.example.dbhealthtool.security.PasswordService;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

@Component
@Order(1)
public class DatabaseInitializer implements ApplicationRunner {

    private final PasswordService passwordService;

    public DatabaseInitializer(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Properties props = AppConfig.loadProperties();

        String toolHost = props.getProperty("tool.db.host", "localhost");
        String toolPort = props.getProperty("tool.db.port", "3306");
        String toolDb = props.getProperty("tool.db.name", "dbhealth_tool");
        String toolUser = props.getProperty("tool.db.username", "root");
        String toolPass = props.getProperty("tool.db.password", "");

        CreateDatabaseIfNotExists.create(
                toolHost, toolPort, toolDb, toolUser, toolPass
        );

        String scanDb = AppConfig.ensureScanDatabaseName();
        props = AppConfig.loadProperties();

        String scanHost = props.getProperty("db.host", "localhost");
        String scanPort = props.getProperty("db.port", "3306");
        String scanUser = props.getProperty("db.username", "root");
        String scanPass = props.getProperty("db.password", "");

        CreateDatabaseIfNotExists.create(
                scanHost, scanPort, scanDb, scanUser, scanPass
        );

        DatabaseConnection.resetToolConnection();
        initToolSchema();
        seedDefaultUser();

        DatabaseConnection.refreshConnection();

        System.out.println("Database initialization complete.");
    }

    private void initToolSchema() throws Exception {
        try (Connection conn = DatabaseConnection.getToolConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        username VARCHAR(255) NOT NULL,
                        password VARCHAR(255) NOT NULL
                    )
                    """
            );

            stmt.executeUpdate(
                    """
                    CREATE TABLE IF NOT EXISTS dashboard_health (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL UNIQUE,
                        health_score INT DEFAULT 0,
                        total_tables INT DEFAULT 0,
                        active_issues INT DEFAULT 0,
                        insights INT DEFAULT 0,
                        last_scan DATETIME NULL,
                        scan_payload LONGTEXT NULL,
                        CONSTRAINT fk_dashboard_user
                            FOREIGN KEY (user_id) REFERENCES users(id)
                            ON DELETE CASCADE
                    )
                    """
            );

            stmt.executeUpdate(
                    """
                    CREATE TABLE IF NOT EXISTS scan_results (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        health_score INT DEFAULT 0,
                        total_tables INT DEFAULT 0,
                        active_issues INT DEFAULT 0,
                        insights INT DEFAULT 0,
                        scan_payload LONGTEXT NOT NULL,
                        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_scan_results_user
                            FOREIGN KEY (user_id) REFERENCES users(id)
                            ON DELETE CASCADE,
                        INDEX idx_scan_user_time (user_id, scanned_at)
                    )
                    """
            );

            stmt.executeUpdate(
                    """
                    CREATE TABLE IF NOT EXISTS user_reports (
                        id VARCHAR(64) PRIMARY KEY,
                        user_id INT NOT NULL,
                        report_type VARCHAR(100) NOT NULL,
                        file_name VARCHAR(255) NOT NULL,
                        file_size VARCHAR(50),
                        status VARCHAR(50),
                        created_on VARCHAR(50),
                        CONSTRAINT fk_user_reports_user
                            FOREIGN KEY (user_id) REFERENCES users(id)
                            ON DELETE CASCADE,
                        INDEX idx_reports_user (user_id)
                    )
                    """
            );

            try {
                stmt.executeUpdate(
                        "ALTER TABLE dashboard_health ADD COLUMN scan_payload LONGTEXT NULL"
                );
            } catch (Exception ignored) {
                // Column already exists
            }

            try {
                stmt.executeUpdate(
                        """
                        ALTER TABLE dashboard_health
                        ADD CONSTRAINT fk_dashboard_user
                            FOREIGN KEY (user_id) REFERENCES users(id)
                            ON DELETE CASCADE
                        """
                );
            } catch (Exception ignored) {
                // Constraint already exists
            }
        }
    }

    private void seedDefaultUser() throws Exception {
        try (Connection conn = DatabaseConnection.getToolConnection()) {

            try (PreparedStatement check = conn.prepareStatement(
                    "SELECT id FROM users WHERE email = ?")) {

                check.setString(1, "demo@gmail.com");

                try (ResultSet rs = check.executeQuery()) {
                    if (rs.next()) {
                        return;
                    }
                }
            }

            String hashed = passwordService.encode("Password@123");

            try (PreparedStatement insert = conn.prepareStatement(
                    "INSERT INTO users (email, username, password) VALUES (?, ?, ?)")) {

                insert.setString(1, "demo@gmail.com");
                insert.setString(2, "Demo User");
                insert.setString(3, hashed);
                insert.executeUpdate();

                System.out.println("Seeded default user: demo@gmail.com");
            }
        }
    }
}
