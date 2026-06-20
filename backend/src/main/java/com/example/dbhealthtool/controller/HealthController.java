package com.example.dbhealthtool.controller;

import com.example.dbhealthtool.cache.ScanCache;
import com.example.dbhealthtool.config.DatabaseConnection;
import com.example.dbhealthtool.model.HealthSnapshot;
import com.example.dbhealthtool.model.ReportInfo;
import com.example.dbhealthtool.model.TableHealth;
import com.example.dbhealthtool.model.TableInfo;
import com.example.dbhealthtool.report.HealthReporter;
import com.example.dbhealthtool.scanner.MetadataScanner;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@CrossOrigin(origins = "*")
@RestController
public class HealthController {

    private static final List<HealthSnapshot> scanHistory =
            new ArrayList<>();

    private static final int MAX_HISTORY = 30;

    private static String lastScanTime = null;

    private final HealthReporter reporter =
            new HealthReporter();

    /* =====================================================
       HOME
    ===================================================== */

    @GetMapping("/")
    public String home() {

        return "DB Health Tool API Running";
    }

    /* =====================================================
       TABLES
    ===================================================== */

    @GetMapping("/tables")
    public List<String> getTables() {

        List<String> tables =
                new ArrayList<>();

        try {

            Connection conn =
                    DatabaseConnection.getConnection();

            MetadataScanner scanner =
                    new MetadataScanner(conn);

            tables =
                    scanner.getAllTableNames();

        } catch (Exception e) {

            e.printStackTrace();
        }

        return tables;
    }

    /* =====================================================
       TABLE STATS
    ===================================================== */

    @GetMapping("/table-stats")
    public List<TableInfo> getTableStats() {

        List<TableInfo> stats =
                new ArrayList<>();

        try {

            Connection conn =
                    DatabaseConnection.getConnection();

            MetadataScanner scanner =
                    new MetadataScanner(conn);

            List<String> tables =
                    scanner.getAllTableNames();

            Statement stmt =
                    conn.createStatement();

            for (String table : tables) {

                try {

                    ResultSet rs =
                            stmt.executeQuery(
                                    "SELECT COUNT(*) FROM `" + table + "`"
                            );

                    int count = 0;

                    if (rs.next()) {

                        count = rs.getInt(1);
                    }

                    stats.add(
                            new TableInfo(table, count)
                    );

                } catch (Exception ex) {

                    System.out.println(
                            "Skipping table: " + table
                    );
                }
            }

        } catch (Exception e) {

            e.printStackTrace();
        }

        return stats;
    }

    /* =====================================================
       SCAN DATABASE
    ===================================================== */

    @GetMapping("/scan")
    public Map<String, Object> scanDatabase() {

        Map<String, Object> response =
                new HashMap<>();

        List<String> suggestions =
                new ArrayList<>();

        List<TableInfo> tableStats =
                new ArrayList<>();

        int totalTables = 0;
        int emptyCount = 0;
        int warningCount = 0;
        int healthyCount = 0;
        int issueCount = 0;

        try {

            Connection conn =
                    DatabaseConnection.getConnection();

            MetadataScanner scanner =
                    new MetadataScanner(conn);

            List<String> tables =
                    scanner.getAllTableNames();

            totalTables = tables.size();

            Statement stmt =
                    conn.createStatement();

            List<Map<String, Object>> tableHealth =
                    new ArrayList<>();

            for (String table : tables) {

                ResultSet rs =
                        stmt.executeQuery(
                                "SELECT COUNT(*) FROM `" + table + "`"
                        );

                int rowCount = 0;

                if (rs.next()) {

                    rowCount = rs.getInt(1);
                }

                TableInfo info =
                        new TableInfo(table, rowCount);

                info.setRowCount(rowCount);

                String status =
                        info.getStatus();

                tableStats.add(info);

                int tableScore =
                        calculateTableScore(rowCount);

                Map<String, Object> tableHealthEntry =
                        new HashMap<>();

                tableHealthEntry.put(
                        "tableName",
                        table
                );

                tableHealthEntry.put(
                        "score",
                        tableScore
                );

                tableHealthEntry.put(
                        "status",
                        status
                );

                tableHealthEntry.put(
                        "rowCount",
                        rowCount
                );

                tableHealth.add(
                        tableHealthEntry
                );

                if (status.equals("Critical")) {

                    emptyCount++;
                    issueCount++;

                    suggestions.add(
                            "Consider removing unused table: "
                                    + table
                    );

                } else if (status.equals("Warning")) {

                    warningCount++;

                    suggestions.add(
                            "Table "
                                    + table
                                    + " contains low amount of data ("
                                    + rowCount
                                    + " rows)"
                    );

                } else {

                    healthyCount++;
                }
            }

            int finalHealthScore =
                    calculateFinalHealthScore(
                            healthyCount,
                            warningCount,
                            emptyCount,
                            totalTables
                    );

            String today =
                    LocalDateTime.now().format(
                            DateTimeFormatter.ofPattern(
                                    "MMM dd, HH:mm"
                            )
                    );

            if (lastScanTime == null ||
                    !lastScanTime.equals(today)) {

                scanHistory.add(
                        0,
                        new HealthSnapshot(
                                today,
                                finalHealthScore
                        )
                );

                lastScanTime = today;

            } else if (!scanHistory.isEmpty()) {

                scanHistory.set(
                        0,
                        new HealthSnapshot(
                                today,
                                finalHealthScore
                        )
                );
            }

            while (scanHistory.size() > MAX_HISTORY) {

                scanHistory.remove(
                        scanHistory.size() - 1
                );
            }

            Map<String, Object> summary =
                    new HashMap<>();

            summary.put(
                    "healthScore",
                    finalHealthScore
            );

            summary.put(
                    "totalTables",
                    totalTables
            );

            summary.put(
                    "activeIssues",
                    issueCount
            );

            summary.put(
                    "insights",
                    healthyCount
            );

            List<Map<String, Object>> distribution =
                    new ArrayList<>();

            Map<String, Object> healthy =
                    new HashMap<>();

            healthy.put("name", "Healthy");
            healthy.put("value", healthyCount);

            Map<String, Object> warning =
                    new HashMap<>();

            warning.put("name", "Warning");
            warning.put("value", warningCount);

            Map<String, Object> critical =
                    new HashMap<>();

            critical.put("name", "Critical");
            critical.put("value", emptyCount);

            distribution.add(healthy);
            distribution.add(warning);
            distribution.add(critical);

            response.put("status", "success");
            response.put("summary", summary);
            response.put("tables", tableStats);
            response.put("distribution", distribution);
            response.put("suggestions", suggestions);
            response.put("scanHistory", scanHistory);
            response.put("tableHealth", tableHealth);

            ScanCache.setLatestScan(response);

        } catch (Exception e) {

            e.printStackTrace();

            response.put("status", "error");
            response.put("message", e.getMessage());
        }

        return response;
    }

    /* =====================================================
       HEALTH SCORE
    ===================================================== */

    private int calculateFinalHealthScore(
            int healthy,
            int warning,
            int critical,
            int total
    ) {

        if (total == 0) {

            return 0;
        }

        int totalScore =
                (healthy * 100)
                        + (warning * 50)
                        + (critical * 20);

        return totalScore / total;
    }

    private int calculateTableScore(
            int rowCount
    ) {

        if (rowCount == 0) {

            return 20;

        } else if (rowCount < 10) {

            return 50;

        } else if (rowCount < 100) {

            return 75;

        } else {

            return 100;
        }
    }

    /* =====================================================
       DASHBOARD
    ===================================================== */

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {

        if (!ScanCache.hasData()) {

            Map<String, Object> empty =
                    new HashMap<>();

            empty.put("status", "empty");
            empty.put("tables", new ArrayList<>());
            empty.put("summary", new HashMap<>());

            return empty;
        }

        return ScanCache.getLatestScan();
    }

    /* =====================================================
       SCAN HISTORY
    ===================================================== */

    @GetMapping("/scan-history")
    public List<HealthSnapshot> getScanHistory() {

        return scanHistory;
    }

    /* =====================================================
       CONFIG
    ===================================================== */

    @GetMapping("/config")
    public Map<String, String> getConfig() {

        Map<String, String> config =
                new HashMap<>();

        try {

            Properties props =
                    new Properties();

            FileInputStream fis =
                    new FileInputStream(
                            "src/main/resources/config.properties"
                    );

            props.load(fis);

            config.put(
                    "host",
                    props.getProperty(
                            "db.host",
                            "localhost"
                    )
            );

            config.put(
                    "port",
                    props.getProperty(
                            "db.port",
                            "3306"
                    )
            );

            config.put(
                    "database",
                    props.getProperty(
                            "db.name",
                            ""
                    )
            );

            config.put(
                    "username",
                    props.getProperty(
                            "db.username",
                            "root"
                    )
            );

            fis.close();

        } catch (Exception e) {

            e.printStackTrace();
        }

        return config;
    }

    /* =====================================================
       TEST CONNECTION
    ===================================================== */

    @PostMapping("/test-connection")
    public Map<String, Object> testConnection(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> response =
                new HashMap<>();

        try {

            String url =
                    "jdbc:mysql://"
                            + body.get("host")
                            + ":"
                            + body.get("port")
                            + "/"
                            + body.get("database")
                            + "?useSSL=false&allowPublicKeyRetrieval=true";

            Connection conn =
                    DriverManager.getConnection(
                            url,
                            body.get("username"),
                            body.get("password")
                    );

            response.put("success", true);

            response.put(
                    "message",
                    "Connection successful"
            );

            conn.close();

        } catch (Exception e) {

            response.put("success", false);

            response.put(
                    "message",
                    e.getMessage()
            );
        }

        return response;
    }

    /* =====================================================
       SAVE CONFIG
    ===================================================== */

    @PostMapping("/save-config")
    public Map<String, Object> saveConfig(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> response =
                new HashMap<>();

        try {

            Properties props =
                    new Properties();

            props.setProperty(
                    "db.host",
                    body.get("host")
            );

            props.setProperty(
                    "db.port",
                    body.get("port")
            );

            props.setProperty(
                    "db.name",
                    body.get("database")
            );

            props.setProperty(
                    "db.username",
                    body.get("username")
            );

            props.setProperty(
                    "db.password",
                    body.get("password")
            );

            FileOutputStream out =
                    new FileOutputStream(
                            "src/main/resources/config.properties"
                    );

            props.store(out, null);

            out.close();

            DatabaseConnection.refreshConnection();

            response.put("success", true);

            response.put(
                    "message",
                    "Configuration saved successfully"
            );

        } catch (Exception e) {

            response.put("success", false);

            response.put(
                    "message",
                    e.getMessage()
            );
        }

        return response;
    }

    /* =====================================================
       RECONNECT
    ===================================================== */

    @PostMapping("/reconnect")
    public Map<String, Object> reconnect() {

        Map<String, Object> response =
                new HashMap<>();

        try {

            DatabaseConnection.refreshConnection();

            response.put("success", true);

            response.put(
                    "message",
                    "Database reconnected successfully!"
            );

        } catch (Exception e) {

            response.put("success", false);

            response.put(
                    "message",
                    e.getMessage()
            );
        }

        return response;
    }

    /* =====================================================
       REPORTS
    ===================================================== */

    @GetMapping("/reports")
    public List<ReportInfo> getReports() {

        return reporter.getReports();
    }

    @PostMapping("/reports/generate")
    public ReportInfo generateReport(
            @RequestParam(defaultValue = "STANDARD")
            String type
    ) throws Exception {

        Connection conn =
                DatabaseConnection.getConnection();

        MetadataScanner scanner =
                new MetadataScanner(conn);

        List<TableHealth> tables =
                scanner.scanTables();

        ReportInfo report =
                reporter.generateReport(tables, type);

        // set report type from frontend
        if (type.equalsIgnoreCase("STANDARD")) {

            report.setType("Standard Report");

        } else if (type.equalsIgnoreCase("SECURITY")) {

            report.setType("Security Audit");

        } else if (type.equalsIgnoreCase("PROFILE")) {

            report.setType("Table Profiling");

        } else {

            report.setType("Database Health");
        }

        return report;
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(
            @PathVariable String id
    ) throws Exception {

        reporter.deleteReport(id);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/reports/download/{fileName}")
    public ResponseEntity<Resource> downloadReport(
            @PathVariable String fileName
    ) throws Exception {

        Path path =
                Paths.get("reports")
                        .resolve(fileName);

        Resource resource =
                new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\""
                                + resource.getFilename()
                                + "\""
                )
                .body(resource);
    }

    /* =====================================================
       LOGIN
    ===================================================== */

    @PostMapping("/auth/login")
    public Map<String, Object> login(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> response =
                new HashMap<>();

        try {

            String email = body.get("email");
            String password = body.get("password");

            Connection conn =
                    DatabaseConnection.getToolConnection();

            PreparedStatement ps =
                    conn.prepareStatement(
                            "SELECT id, username, email FROM users " +
                                    "WHERE email = ? AND password = ?"
                    );

            ps.setString(1, email);
            ps.setString(2, password);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                response.put("success", true);
                response.put("message", "Login successful");
                response.put("userId", rs.getInt("id"));
                response.put("username", rs.getString("username"));
                response.put("email", rs.getString("email"));

            } else {

                response.put("success", false);
                response.put("message", "Invalid email or password");
            }

        } catch (Exception e) {

            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    /* =====================================================
       REGISTER
    ===================================================== */

    @PostMapping("/auth/register")
    public Map<String, Object> register(
            @RequestBody Map<String, String> body
    ) {

        Map<String, Object> response =
                new HashMap<>();

        try {

            String email = body.get("email");
            String password = body.get("password");
            String fullName = body.get("fullName");
            String username = (fullName != null && !fullName.isEmpty())
                    ? fullName
                    : email.split("@")[0];

            Connection conn =
                    DatabaseConnection.getToolConnection();

            // Check if email already exists
            PreparedStatement checkPs =
                    conn.prepareStatement(
                            "SELECT id FROM users WHERE email = ?"
                    );

            checkPs.setString(1, email);

            ResultSet rs = checkPs.executeQuery();

            if (rs.next()) {

                response.put("success", false);
                response.put("message", "Email already registered");
                return response;
            }

            // Insert new user
            PreparedStatement insertPs =
                    conn.prepareStatement(
                            "INSERT INTO users (email, username, password) " +
                                    "VALUES (?, ?, ?)"
                    );

            insertPs.setString(1, email);
            insertPs.setString(2, username);
            insertPs.setString(3, password);
            insertPs.executeUpdate();

            response.put("success", true);
            response.put("message", "Account created successfully");

        } catch (Exception e) {

            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }
}