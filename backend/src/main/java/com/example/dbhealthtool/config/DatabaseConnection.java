package com.example.dbhealthtool.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Two HikariCP connection pools:
 *  - scan pool: the database that is being health-checked (changes when the
 *               user saves new settings -> see refreshConnection())
 *  - tool pool: the tool's own database (users, scan results, reports)
 *
 * IMPORTANT: getConnection() / getToolConnection() BORROW a connection from
 * the pool. Always use try-with-resources so it is returned to the pool:
 *
 *     try (Connection conn = DatabaseConnection.getConnection()) { ... }
 */
public final class DatabaseConnection {

    private static final Object LOCK = new Object();

    private static volatile HikariDataSource scanPool;
    private static volatile HikariDataSource toolPool;

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(DatabaseConnection::shutdown));
    }

    private DatabaseConnection() {
    }

    // ------------------------------------------------------------------
    // Borrow connections
    // ------------------------------------------------------------------

    public static Connection getConnection() throws SQLException {
        return getScanPool().getConnection();
    }

    public static Connection getToolConnection() throws SQLException {
        return getToolPool().getConnection();
    }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    /** Rebuild the scan pool from config.properties (call after settings change). */
    public static void refreshConnection() {
        synchronized (LOCK) {
            closeQuietly(scanPool);
            scanPool = null;
        }

        try {
            getScanPool();
        } catch (SQLException e) {
            System.out.println("Scan Database Connection Failed: " + e.getMessage());
        }
    }

    public static void resetToolConnection() {
        synchronized (LOCK) {
            closeQuietly(toolPool);
            toolPool = null;
        }
    }

    public static void shutdown() {
        synchronized (LOCK) {
            closeQuietly(scanPool);
            closeQuietly(toolPool);
            scanPool = null;
            toolPool = null;
        }
    }

    // ------------------------------------------------------------------
    // Pool creation
    // ------------------------------------------------------------------

    private static HikariDataSource getScanPool() throws SQLException {
        HikariDataSource pool = scanPool;
        if (pool != null && !pool.isClosed()) {
            return pool;
        }

        synchronized (LOCK) {
            pool = scanPool;
            if (pool == null || pool.isClosed()) {
                Properties props = AppConfig.loadProperties();

                String host = props.getProperty("db.host", "localhost");
                String port = props.getProperty("db.port", "3306");
                String db = props.getProperty("db.name", AppConfig.DEFAULT_SCAN_DB).trim();
                if (db.isEmpty()) {
                    db = AppConfig.DEFAULT_SCAN_DB;
                }
                String user = props.getProperty("db.username", "root");
                String pass = props.getProperty("db.password", "");

                try {
                    CreateDatabaseIfNotExists.create(host, port, db, user, pass);
                    pool = buildPool("dbhealth-scan", host, port, db, user, pass, 5);
                } catch (Exception e) {
                    throw new SQLException(
                            "Unable to connect to scan database. Check Settings.", e
                    );
                }

                scanPool = pool;
                System.out.println("Scan Database pool ready: " + host + ":" + port + "/" + db);
            }
            return pool;
        }
    }

    private static HikariDataSource getToolPool() throws SQLException {
        HikariDataSource pool = toolPool;
        if (pool != null && !pool.isClosed()) {
            return pool;
        }

        synchronized (LOCK) {
            pool = toolPool;
            if (pool == null || pool.isClosed()) {
                Properties props = AppConfig.loadProperties();

                String host = props.getProperty("tool.db.host", "localhost");
                String port = props.getProperty("tool.db.port", "3306");
                String db = props.getProperty("tool.db.name", "dbhealth_tool");
                String user = props.getProperty("tool.db.username", "root");
                String pass = props.getProperty("tool.db.password", "");

                try {
                    CreateDatabaseIfNotExists.create(host, port, db, user, pass);
                    pool = buildPool("dbhealth-tool", host, port, db, user, pass, 10);
                } catch (Exception e) {
                    throw new SQLException("Unable to connect to tool database.", e);
                }

                toolPool = pool;
                System.out.println("Tool Database pool ready: " + host + ":" + port + "/" + db);
            }
            return pool;
        }
    }

    private static HikariDataSource buildPool(
            String name,
            String host,
            String port,
            String db,
            String user,
            String pass,
            int maxPoolSize
    ) {
        HikariConfig cfg = new HikariConfig();
        cfg.setPoolName(name);
        cfg.setJdbcUrl(
                "jdbc:mysql://" + host + ":" + port + "/" + db
                        + "?useSSL=false&allowPublicKeyRetrieval=true"
        );
        cfg.setUsername(user);
        cfg.setPassword(pass);
        cfg.setMaximumPoolSize(maxPoolSize);
        cfg.setMinimumIdle(1);
        cfg.setConnectionTimeout(5_000);
        cfg.setValidationTimeout(3_000);
        cfg.setMaxLifetime(30 * 60 * 1000L);
        return new HikariDataSource(cfg);
    }

    private static void closeQuietly(HikariDataSource pool) {
        if (pool != null && !pool.isClosed()) {
            try {
                pool.close();
            } catch (Exception ignored) {
            }
        }
    }
}
