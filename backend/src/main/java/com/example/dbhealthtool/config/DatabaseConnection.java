package com.example.dbhealthtool.config;

import java.io.FileInputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;

public class DatabaseConnection {

    private static Connection connection;
    private static String currentHost = null;
    private static String currentPort = null;
    private static String currentDb = null;
    private static String currentUser = null;
    private static String currentPass = null;

    public static Connection getConnection() {
        return getConnection(false);
    }

    public static Connection getConnection(boolean forceNew) {
        try {
            // Load current config from file
            Properties props = new Properties();
            FileInputStream fis = new FileInputStream(
                    "src/main/resources/config.properties"
            );
            props.load(fis);
            fis.close();

            String host = props.getProperty("db.host", "localhost");
            String port = props.getProperty("db.port", "3306");
            String db = props.getProperty("db.name", "");
            String user = props.getProperty("db.username", "root");
            String pass = props.getProperty("db.password", "");

            // Check if config changed or connection is invalid
            boolean configChanged = !host.equals(currentHost) || !port.equals(currentPort) ||
                    !db.equals(currentDb) || !user.equals(currentUser) ||
                    !pass.equals(currentPass);

            if (forceNew || configChanged || connection == null || connection.isClosed()) {
                // Close old connection if exists
                if (connection != null && !connection.isClosed()) {
                    connection.close();
                }

                String url = "jdbc:mysql://" + host + ":" + port + "/" + db + "?useSSL=false&allowPublicKeyRetrieval=true";
                connection = DriverManager.getConnection(url, user, pass);

                currentHost = host;
                currentPort = port;
                currentDb = db;
                currentUser = user;
                currentPass = pass;

                System.out.println("Database Connected: " + url);
            }

        } catch (Exception e) {
            System.out.println("Database Connection Failed: " + e.getMessage());
            e.printStackTrace();
        }

        return connection;
    }

    public static void refreshConnection() {
        getConnection(true);
    }
}