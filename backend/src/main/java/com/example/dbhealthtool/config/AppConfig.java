package com.example.dbhealthtool.config;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

public final class AppConfig {

    public static final String DEFAULT_SCAN_DB = "test_db";
    private static final String CONFIG_RELATIVE = "src/main/resources/config.properties";

    private AppConfig() {
    }

    public static Path resolveConfigPath() {
        Path primary = Paths.get(CONFIG_RELATIVE);
        if (Files.exists(primary)) {
            return primary;
        }

        Path fallback = Paths.get("config.properties");
        if (Files.exists(fallback)) {
            return fallback;
        }

        return primary;
    }

    public static Properties loadProperties() {
        Properties props = new Properties();
        Path path = resolveConfigPath();

        try {
            if (Files.exists(path)) {
                try (FileInputStream fis = new FileInputStream(path.toFile())) {
                    props.load(fis);
                }
            } else {
                try (InputStream is = AppConfig.class.getClassLoader()
                        .getResourceAsStream("config.properties")) {
                    if (is != null) {
                        props.load(is);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Failed to load config: " + e.getMessage());
        }

        applyDefaults(props);
        return props;
    }

    public static void saveProperties(Properties props) {
        applyDefaults(props);

        try {
            Path path = resolveConfigPath();
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }

            try (FileOutputStream out = new FileOutputStream(path.toFile())) {
                props.store(out, "DB Health Tool Configuration");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to save config.properties", e);
        }
    }

    public static String ensureScanDatabaseName() {
        Properties props = loadProperties();
        String name = props.getProperty("db.name", "").trim();

        if (name.isEmpty()) {
            name = DEFAULT_SCAN_DB;
            props.setProperty("db.name", name);
            saveProperties(props);
            System.out.println("db.name was empty; defaulted to " + name);
        }

        return name;
    }

    public static void updateScanConfig(
            String host,
            String port,
            String database,
            String username,
            String password
    ) {
        Properties props = loadProperties();

        props.setProperty("db.host", host != null ? host : "localhost");
        props.setProperty("db.port", port != null ? port : "3306");
        props.setProperty(
                "db.name",
                (database != null && !database.isBlank()) ? database.trim() : DEFAULT_SCAN_DB
        );
        props.setProperty("db.username", username != null ? username : "root");
        props.setProperty("db.password", password != null ? password : "");

        saveProperties(props);
    }

    private static void applyDefaults(Properties props) {
        props.putIfAbsent("db.host", "localhost");
        props.putIfAbsent("db.port", "3306");
        props.putIfAbsent("db.username", "root");
        props.putIfAbsent("db.password", "");

        props.putIfAbsent("tool.db.host", "localhost");
        props.putIfAbsent("tool.db.port", "3306");
        props.putIfAbsent("tool.db.name", "dbhealth_tool");
        props.putIfAbsent("tool.db.username", "root");
        props.putIfAbsent("tool.db.password", "");

        String scanDb = props.getProperty("db.name", "").trim();
        if (scanDb.isEmpty()) {
            props.setProperty("db.name", DEFAULT_SCAN_DB);
        }
    }
}
