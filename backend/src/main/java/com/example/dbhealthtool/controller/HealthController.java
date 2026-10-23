package com.example.dbhealthtool.controller;

import com.example.dbhealthtool.cache.ScanCache;
import com.example.dbhealthtool.config.AppConfig;
import com.example.dbhealthtool.config.DatabaseConnection;
import com.example.dbhealthtool.security.JwtService;
import com.example.dbhealthtool.security.PasswordService;
import com.example.dbhealthtool.security.UserService;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
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

@RestController
public class HealthController {

    private static final int MAX_HISTORY = 30;

    private static final Gson gson = new Gson();

    private final HealthReporter reporter = new HealthReporter();

    private final PasswordService passwordService;
    private final UserService userService;
    private final JwtService jwtService;

    public HealthController(
            PasswordService passwordService,
            UserService userService,
            JwtService jwtService
    ) {
        this.passwordService = passwordService;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private Map<String, Object> invalidUserResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Invalid or unauthorized userId");
        response.put("summary", ScanCache.emptyScan().get("summary"));
        response.put("tables", new ArrayList<>());
        response.put("tableHealth", new ArrayList<>());
        response.put("issues", new ArrayList<>());
        response.put("suggestions", new ArrayList<>());
        response.put("distribution", ScanCache.emptyScan().get("distribution"));
        response.put("scanHistory", new ArrayList<>());
        return response;
    }

    /**
     * FIX: All endpoints validate userId before touching any data.
     * A request without a valid, existing userId is rejected outright.
     */
    private boolean isAuthorizedUser(int userId) {
        return userId > 0 && userService.exists(userId);
    }

    // =========================================================
    // HOME
    // =========================================================

    @GetMapping("/")
    public String home() {
        return "DB Health Tool API Running";
    }

    // =========================================================
    // TABLES  (admin / debug only — not user-scoped)
    // =========================================================

    @GetMapping("/tables")
    public List<String> getTables() {
        List<String> tables = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection()) {
            tables = new MetadataScanner(conn).getAllTableNames();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tables;
    }

    @GetMapping("/table-stats")
    public List<TableInfo> getTableStats() {
        List<TableInfo> stats = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection()) {
            stats = new MetadataScanner(conn).getTableRowCounts();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return stats;
    }

    // =========================================================
    // SCAN DATABASE
    // FIX: Scan is user-scoped. Cache is keyed by userId.
    //      Results are persisted under that userId in dashboard_health
    //      and scan_results — never shared with other users.
    // =========================================================

    @GetMapping("/scan")
    public Map<String, Object> scanDatabase(@RequestAttribute("userId") int userId) {

        // Step 1 — reject unknown / anonymous callers immediately
        if (!isAuthorizedUser(userId)) {
            return invalidUserResponse();
        }

        List<String> suggestions = new ArrayList<>();
        List<Map<String, Object>> issues = new ArrayList<>();
        List<TableInfo> tableStats = new ArrayList<>();
        List<Map<String, Object>> tableHealth = new ArrayList<>();

        int totalTables = 0;
        int emptyCount = 0;
        int warningCount = 0;
        int healthyCount = 0;
        int issueCount = 0;

        try {
            // One short-lived pooled connection; returned to the pool right away.
            // scanTables() fetches rows, columns, primary keys and indexes in bulk.
            List<TableHealth> scannedTables;
            try (Connection conn = DatabaseConnection.getConnection()) {
                scannedTables = new MetadataScanner(conn).scanTables();
            }
            totalTables = scannedTables.size();

            int scoreSum = 0;
            int tablesWithIndex = 0;
            int tablesWellFormed = 0;
            int tablesEfficient = 0;

            for (TableHealth th : scannedTables) {
                String table = th.getTableName();
                int rowCount = th.getRowCount();

                // status and score both come from ScoreRules (via TableHealth)
                String status = th.getStatus();
                int tableScore = th.getScore();
                scoreSum += tableScore;

                tableStats.add(new TableInfo(table, rowCount));

                Map<String, Object> tableHealthEntry = new HashMap<>();
                tableHealthEntry.put("tableName", table);
                tableHealthEntry.put("score", tableScore);
                tableHealthEntry.put("status", status);
                tableHealthEntry.put("rowCount", rowCount);
                tableHealthEntry.put("columnCount", th.getColumnCount());
                tableHealthEntry.put("hasPrimaryKey", th.isHasPrimaryKey());
                tableHealthEntry.put("indexCount", th.getIndexCount());
                tableHealth.add(tableHealthEntry);

                if (status.equals("Critical")) {
                    emptyCount++;
                    issueCount++;
                    suggestions.add("Consider removing unused table: " + table);
                    issues.add(buildIssue(table, "Empty table with zero rows", "Critical"));
                } else if (status.equals("Warning")) {
                    warningCount++;
                    suggestions.add("Table " + table + " contains low amount of data (" + rowCount + " rows)");
                    issues.add(buildIssue(table, "Low row count (" + rowCount + " rows)", "Warning"));
                } else {
                    healthyCount++;
                }

                // primary key / index / normalization advice from SuggestionEngine
                suggestions.addAll(th.getSuggestions());

                // inputs for the three quality percentages
                if (th.getIndexCount() > 0) {
                    tablesWithIndex++;
                }
                if (th.isHasPrimaryKey() && th.getColumnCount() <= 10) {
                    tablesWellFormed++;
                }
                if (th.isHasPrimaryKey()
                        && (rowCount < 1000 || th.getIndexCount() > 1)) {
                    tablesEfficient++;
                }
            }

            // Overall score = average of the per-table scores shown in the charts
            int finalHealthScore = totalTables == 0 ? 0 : scoreSum / totalTables;

            String today = LocalDateTime.now().format(
                    DateTimeFormatter.ofPattern("MMM dd, HH:mm")
            );

            // Step 2 — read THIS user's scan history only
            List<HealthSnapshot> scanHistory = ScanCache.getScanHistory(userId);

            String lastScanTime = scanHistory.isEmpty() ? null : scanHistory.get(0).getDate();
            if (lastScanTime == null || !lastScanTime.equals(today)) {
                scanHistory.add(0, new HealthSnapshot(today, finalHealthScore));
            } else {
                scanHistory.set(0, new HealthSnapshot(today, finalHealthScore));
            }
            while (scanHistory.size() > MAX_HISTORY) {
                scanHistory.remove(scanHistory.size() - 1);
            }

            // Step 3 — write back under userId key
            ScanCache.updateScanHistory(userId, scanHistory);

            Map<String, Object> summary = new HashMap<>();
            summary.put("healthScore", finalHealthScore);
            summary.put("totalTables", totalTables);
            summary.put("activeIssues", issueCount);
            summary.put("insights", healthyCount);

            List<Map<String, Object>> distribution = buildDistribution(
                    healthyCount, warningCount, emptyCount
            );

            Map<String, Object> response = buildScanResponse(
                    "success", summary, tableStats, tableHealth,
                    issues, suggestions, distribution, scanHistory
            );

            // Quality percentages shown on the Scan page (0-100):
            //  indexCoverage   - tables that have at least one index
            //  schemaNormality - tables with a primary key and <= 10 columns
            //  queryEfficiency - tables with a primary key that are small (<1000 rows)
            //                    or have a secondary index (indexCount includes PRIMARY)
            response.put("indexCoverage", percent(tablesWithIndex, totalTables));
            response.put("schemaNormality", percent(tablesWellFormed, totalTables));
            response.put("queryEfficiency", percent(tablesEfficient, totalTables));

            // Step 4 — persist under userId so the dashboard can reload it
            persistDashboardHealth(userId, finalHealthScore, totalTables,
                    issueCount, healthyCount, response);
            persistScanResult(userId, finalHealthScore, totalTables,
                    issueCount, healthyCount, response);

            // Step 5 — store in per-user in-memory cache
            ScanCache.setLatestScan(userId, response);
            response.put("userId", userId);
            return response;

        } catch (Exception e) {
            e.printStackTrace();

            List<HealthSnapshot> scanHistory = ScanCache.getScanHistory(userId);
            Map<String, Object> summary = new HashMap<>();
            summary.put("healthScore", 0);
            summary.put("totalTables", totalTables);
            summary.put("activeIssues", issueCount);
            summary.put("insights", healthyCount);

            Map<String, Object> response = buildScanResponse(
                    "error", summary, tableStats, tableHealth,
                    issues, suggestions,
                    buildDistribution(healthyCount, warningCount, emptyCount),
                    scanHistory
            );
            response.put("message", e.getMessage());
            return response;
        }
    }

    // =========================================================
    // SCORE HELPERS
    // =========================================================

    private int percent(int part, int total) {
        return total == 0 ? 0 : Math.round(part * 100f / total);
    }

    private Map<String, Object> buildIssue(String table, String detail, String severity) {
        Map<String, Object> issue = new HashMap<>();
        issue.put("title", table + ": " + detail);
        issue.put("severity", severity);
        issue.put("tableName", table);
        return issue;
    }

    private List<Map<String, Object>> buildDistribution(int healthyCount, int warningCount, int emptyCount) {
        List<Map<String, Object>> distribution = new ArrayList<>();

        Map<String, Object> healthy = new HashMap<>();
        healthy.put("name", "Healthy");
        healthy.put("value", healthyCount);
        distribution.add(healthy);

        Map<String, Object> warning = new HashMap<>();
        warning.put("name", "Warning");
        warning.put("value", warningCount);
        distribution.add(warning);

        Map<String, Object> critical = new HashMap<>();
        critical.put("name", "Critical");
        critical.put("value", emptyCount);
        distribution.add(critical);

        return distribution;
    }

    private Map<String, Object> buildScanResponse(
            String status,
            Map<String, Object> summary,
            List<TableInfo> tables,
            List<Map<String, Object>> tableHealth,
            List<Map<String, Object>> issues,
            List<String> suggestions,
            List<Map<String, Object>> distribution,
            List<HealthSnapshot> history
    ) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("summary", summary);
        response.put("tables", tables);
        response.put("tableHealth", tableHealth);
        response.put("issues", issues);
        response.put("suggestions", suggestions);
        response.put("distribution", distribution);
        response.put("scanHistory", history);
        return response;
    }

    // =========================================================
    // PERSISTENCE  (always userId-scoped)
    // =========================================================

    private void persistDashboardHealth(
            int userId, int healthScore, int totalTables,
            int activeIssues, int insights, Map<String, Object> scanPayload
    ) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {
            String payloadJson = gson.toJson(scanPayload);

            PreparedStatement ps = toolConn.prepareStatement("""
                    INSERT INTO dashboard_health
                        (user_id, health_score, total_tables, active_issues, insights, last_scan, scan_payload)
                    VALUES (?, ?, ?, ?, ?, NOW(), ?)
                    ON DUPLICATE KEY UPDATE
                        health_score = VALUES(health_score),
                        total_tables = VALUES(total_tables),
                        active_issues = VALUES(active_issues),
                        insights = VALUES(insights),
                        last_scan = NOW(),
                        scan_payload = VALUES(scan_payload)
                    """);

            ps.setInt(1, userId);
            ps.setInt(2, healthScore);
            ps.setInt(3, totalTables);
            ps.setInt(4, activeIssues);
            ps.setInt(5, insights);
            ps.setString(6, payloadJson);
            ps.executeUpdate();

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void persistScanResult(
            int userId, int healthScore, int totalTables,
            int activeIssues, int insights, Map<String, Object> scanPayload
    ) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {
            String payloadJson = gson.toJson(scanPayload);

            PreparedStatement ps = toolConn.prepareStatement("""
                    INSERT INTO scan_results
                        (user_id, health_score, total_tables, active_issues, insights, scan_payload, scanned_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                    """);

            ps.setInt(1, userId);
            ps.setInt(2, healthScore);
            ps.setInt(3, totalTables);
            ps.setInt(4, activeIssues);
            ps.setInt(5, insights);
            ps.setString(6, payloadJson);
            ps.executeUpdate();

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    // =========================================================
    // DASHBOARD
    // FIX: Loads from DB filtered by userId — never reads another
    //      user's row because the SQL WHERE clause includes user_id.
    // =========================================================

    private Map<String, Object> loadDashboardFromDb(int userId) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {

            // WHERE user_id = ? ensures strict per-user isolation
            PreparedStatement ps = toolConn.prepareStatement(
                    "SELECT scan_payload FROM dashboard_health WHERE user_id = ?"
            );
            ps.setInt(1, userId);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                String payload = rs.getString("scan_payload");
                if (payload != null && !payload.isBlank()) {
                    Map<String, Object> data = gson.fromJson(
                            payload,
                            new TypeToken<Map<String, Object>>() {}.getType()
                    );
                    ScanCache.restoreScan(userId, data);
                    return ScanCache.getLatestScan(userId);
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return ScanCache.emptyScan();
    }

    private Map<String, Object> resolveUserDashboard(int userId) {
        if (!isAuthorizedUser(userId)) {
            return invalidUserResponse();
        }

        if (ScanCache.hasCachedScan(userId)) {
            Map<String, Object> cached = ScanCache.getLatestScan(userId);
            cached.put("userId", userId);
            return cached;
        }

        Map<String, Object> loaded = loadDashboardFromDb(userId);
        loaded.put("userId", userId);
        return loaded;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard(@RequestAttribute("userId") int userId) {
        return resolveUserDashboard(userId);
    }

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    @GetMapping("/notifications")
    public Map<String, Object> getNotifications(@RequestAttribute("userId") int userId) {
        if (!isAuthorizedUser(userId)) {
            Map<String, Object> response = new HashMap<>();
            response.put("count", 0);
            response.put("notifications", new ArrayList<>());
            response.put("hasData", false);
            response.put("message", "Invalid userId");
            return response;
        }

        Map<String, Object> dashboard = resolveUserDashboard(userId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issues =
                (List<Map<String, Object>>) dashboard.getOrDefault("issues", new ArrayList<>());

        Map<String, Object> response = new HashMap<>();
        response.put("count", issues.size());
        response.put("notifications", issues);
        response.put("hasData", "success".equals(dashboard.get("status")));
        return response;
    }

    // =========================================================
    // SCAN HISTORY
    // =========================================================

    @GetMapping("/scan-history")
    public List<HealthSnapshot> getScanHistory(@RequestAttribute("userId") int userId) {
        if (!isAuthorizedUser(userId)) return new ArrayList<>();
        return ScanCache.getScanHistory(userId);
    }

    // =========================================================
    // CONFIG
    // =========================================================

    @GetMapping("/config")
    public Map<String, String> getConfig() {
        Map<String, String> config = new HashMap<>();
        try {
            Properties props = AppConfig.loadProperties();
            config.put("host", props.getProperty("db.host", "localhost"));
            config.put("port", props.getProperty("db.port", "3306"));
            config.put("database", props.getProperty("db.name", AppConfig.DEFAULT_SCAN_DB));
            config.put("username", props.getProperty("db.username", "root"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return config;
    }

    // =========================================================
    // TEST CONNECTION
    // =========================================================

    @PostMapping("/test-connection")
    public Map<String, Object> testConnection(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String url = "jdbc:mysql://"
                    + body.get("host") + ":"
                    + body.get("port") + "/"
                    + body.get("database")
                    + "?useSSL=false&allowPublicKeyRetrieval=true";

            Connection conn = DriverManager.getConnection(
                    url, body.get("username"), body.get("password")
            );
            response.put("success", true);
            response.put("message", "Connection successful");
            conn.close();
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    // =========================================================
    // SAVE CONFIG
    // =========================================================

    @PostMapping("/save-config")
    public Map<String, Object> saveConfig(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            AppConfig.updateScanConfig(
                    body.get("host"), body.get("port"),
                    body.get("database"), body.get("username"), body.get("password")
            );
            DatabaseConnection.refreshConnection();
            response.put("success", true);
            response.put("message", "Configuration saved successfully");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    // =========================================================
    // RECONNECT
    // =========================================================

    @PostMapping("/reconnect")
    public Map<String, Object> reconnect() {
        Map<String, Object> response = new HashMap<>();
        try {
            DatabaseConnection.refreshConnection();
            response.put("success", true);
            response.put("message", "Database reconnected successfully!");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    // =========================================================
    // REPORTS
    // FIX: All report endpoints require userId and scope queries to
    //      that user via WHERE user_id = ?.
    //      Download also verifies the filename contains _u{userId}_
    //      so one user cannot download another user's file.
    // =========================================================

    @GetMapping("/reports")
    public List<ReportInfo> getReports(@RequestAttribute("userId") int userId) {
        if (!isAuthorizedUser(userId)) return new ArrayList<>();
        loadUserReportsFromDb(userId);
        return reporter.getReports(userId);
    }

    @PostMapping("/reports/generate")
    public ReportInfo generateReport(
            @RequestAttribute("userId") int userId,
            @RequestParam(defaultValue = "STANDARD") String type
    ) throws Exception {

        if (!isAuthorizedUser(userId)) {
            throw new IllegalArgumentException("Invalid userId");
        }

        List<TableHealth> tables;
        try (Connection conn = DatabaseConnection.getConnection()) {
            tables = new MetadataScanner(conn).scanTables();
        }

        ReportInfo report = reporter.generateReport(userId, tables, type);

        if (type.equalsIgnoreCase("STANDARD")) {
            report.setType("Standard Report");
        } else if (type.equalsIgnoreCase("SECURITY")) {
            report.setType("Security Audit");
        } else if (type.equalsIgnoreCase("PROFILE")) {
            report.setType("Table Profiling");
        } else {
            report.setType("Database Health");
        }

        persistUserReport(userId, report);
        return report;
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(
            @PathVariable String id,
            @RequestAttribute("userId") int userId
    ) throws Exception {

        if (!isAuthorizedUser(userId)) {
            return ResponseEntity.badRequest().build();
        }

        reporter.deleteReport(userId, id);
        deleteUserReportFromDb(userId, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reports/download/{fileName}")
    public ResponseEntity<Resource> downloadReport(
            @PathVariable String fileName,
            @RequestAttribute("userId") int userId
    ) throws Exception {

        if (!isAuthorizedUser(userId)) {
            return ResponseEntity.status(403).build();
        }

        // FIX: Verify the file belongs to this user by checking the
        // filename contains _u{userId}_  (set by HealthReporter).
        // This prevents user-A from downloading user-B's report.
        if (!fileName.contains("_u" + userId + "_")) {
            return ResponseEntity.status(403).build();
        }

        Path reportsDir = Paths.get("reports").toAbsolutePath().normalize();
        Path path = reportsDir.resolve(fileName).normalize();
        if (!path.startsWith(reportsDir)) {
            return ResponseEntity.status(403).build();
        }
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    private void persistUserReport(int userId, ReportInfo report) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {

            PreparedStatement ps = toolConn.prepareStatement("""
                    INSERT INTO user_reports
                        (id, user_id, report_type, file_name, file_size, status, created_on)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        report_type = VALUES(report_type),
                        file_name = VALUES(file_name),
                        file_size = VALUES(file_size),
                        status = VALUES(status),
                        created_on = VALUES(created_on)
                    """);

            ps.setString(1, report.getId());
            ps.setInt(2, userId);
            ps.setString(3, report.getType());
            ps.setString(4, report.getFileName());
            ps.setString(5, report.getSize());
            ps.setString(6, report.getStatus());
            ps.setString(7, report.getCreatedOn());
            ps.executeUpdate();

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void loadUserReportsFromDb(int userId) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {

            // WHERE user_id = ? — only this user's reports
            PreparedStatement ps = toolConn.prepareStatement("""
                    SELECT id, report_type, file_name, file_size, status, created_on
                    FROM user_reports
                    WHERE user_id = ?
                    ORDER BY created_on DESC
                    """);
            ps.setInt(1, userId);

            ResultSet rs = ps.executeQuery();
            List<ReportInfo> reports = new ArrayList<>();

            while (rs.next()) {
                ReportInfo report = new ReportInfo();
                report.setId(rs.getString("id"));
                report.setType(rs.getString("report_type"));
                report.setFileName(rs.getString("file_name"));
                report.setSize(rs.getString("file_size"));
                report.setStatus(rs.getString("status"));
                report.setCreatedOn(rs.getString("created_on"));
                reports.add(report);
            }

            reporter.restoreReports(userId, reports);

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void deleteUserReportFromDb(int userId, String reportId) {
        try (Connection toolConn = DatabaseConnection.getToolConnection()) {

            // WHERE user_id = ? AND id = ? prevents deleting another user's report
            PreparedStatement ps = toolConn.prepareStatement(
                    "DELETE FROM user_reports WHERE user_id = ? AND id = ?"
            );
            ps.setInt(1, userId);
            ps.setString(2, reportId);
            ps.executeUpdate();

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    // =========================================================
    // LOGIN
    // FIX: Returns userId in the response — frontend stores it in
    //      session and sends it with every subsequent API call.
    // =========================================================

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        try {
            String email = body.get("email");
            String password = body.get("password");

            if (email == null || email.isBlank() || password == null || password.isBlank()) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return response;
            }

            try (Connection conn = DatabaseConnection.getToolConnection();
                 PreparedStatement ps = conn.prepareStatement(
                         "SELECT id, username, email, password FROM users WHERE email = ?")) {

                ps.setString(1, email.trim());

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && passwordService.matches(password, rs.getString("password"))) {
                        int userId = rs.getInt("id");

                        // Clear the in-memory cache so this login always gets a fresh
                        // load from the database - prevents stale data across logouts.
                        ScanCache.clearUser(userId);

                        response.put("success", true);
                        response.put("message", "Login successful");
                        response.put("userId", userId);
                        response.put("token", jwtService.issue(userId));
                        response.put("username", rs.getString("username"));
                        response.put("email", rs.getString("email"));
                    } else {
                        response.put("success", false);
                        response.put("message", "Invalid email or password");
                    }
                }
            }

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    // =========================================================
    // REGISTER
    // =========================================================

    @PostMapping("/auth/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        try {
            String email = body.get("email");
            String password = body.get("password");
            String fullName = body.get("fullName");

            if (email == null || email.isBlank() || password == null || password.isBlank()) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return response;
            }

            email = email.trim();

            String username = (fullName != null && !fullName.isBlank())
                    ? fullName.trim()
                    : email.split("@")[0];

            try (Connection conn = DatabaseConnection.getToolConnection()) {

                try (PreparedStatement checkPs = conn.prepareStatement(
                        "SELECT id FROM users WHERE email = ?")) {

                    checkPs.setString(1, email);

                    try (ResultSet rs = checkPs.executeQuery()) {
                        if (rs.next()) {
                            response.put("success", false);
                            response.put("message", "Email already registered");
                            return response;
                        }
                    }
                }

                try (PreparedStatement insertPs = conn.prepareStatement(
                        "INSERT INTO users (email, username, password) VALUES (?, ?, ?)")) {

                    insertPs.setString(1, email);
                    insertPs.setString(2, username);
                    insertPs.setString(3, passwordService.encode(password));
                    insertPs.executeUpdate();
                }
            }

            response.put("success", true);
            response.put("message", "Account created successfully");

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }
}
