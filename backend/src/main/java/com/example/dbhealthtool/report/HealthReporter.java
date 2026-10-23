package com.example.dbhealthtool.report;

import com.example.dbhealthtool.model.ReportInfo;
import com.example.dbhealthtool.model.TableHealth;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class HealthReporter {

    private final Map<Integer, List<ReportInfo>> userReports =
            new ConcurrentHashMap<>();

    public List<ReportInfo> getReports(int userId) {
        return new ArrayList<>(
                userReports.getOrDefault(userId, new ArrayList<>())
        );
    }

    public void restoreReports(int userId, List<ReportInfo> reports) {
        userReports.put(userId, new ArrayList<>(reports));
    }

    public ReportInfo generateReport(
            int userId,
            List<TableHealth> tables,
            String type
    ) throws Exception {

        File dir = new File("reports");

        if (!dir.exists()) {
            dir.mkdirs();
        }

        String timestamp =
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern(
                                "yyyyMMdd_HHmmss_SSS"
                        )
                );

        // FIX: embed _u{userId}_ in filename so the download endpoint
        // can verify the file belongs to this user (prevents cross-user access).
        String fileName =
                "health_report_u" + userId + "_" + timestamp + ".txt";

        Path reportFile =
                Paths.get("reports", fileName);

        StringBuilder content =
                new StringBuilder();

        content.append("USER ID: ").append(userId).append("\n");
        content.append("REPORT TYPE: ").append(type).append("\n");
        content.append("GENERATED: ").append(LocalDateTime.now()).append("\n\n");

        if (type.equalsIgnoreCase("STANDARD")) {

            content.append("STANDARD DATABASE REPORT\n\n");

            for (TableHealth table : tables) {

                content.append("Table: ")
                        .append(table.getTableName())
                        .append("\n");

                content.append("Rows: ")
                        .append(table.getRowCount())
                        .append("\n");

                content.append("Score: ")
                        .append(table.getScore())
                        .append("\n");

                content.append("----------------------\n");
            }

        } else if (type.equalsIgnoreCase("SECURITY")) {

            content.append("SECURITY AUDIT REPORT\n\n");

            for (TableHealth table : tables) {

                content.append("Table: ")
                        .append(table.getTableName())
                        .append("\n");

                content.append("Primary Key: ")
                        .append(table.isHasPrimaryKey())
                        .append("\n");

                content.append("Indexes: ")
                        .append(table.getIndexCount())
                        .append("\n");

                content.append("----------------------\n");
            }

        } else if (type.equalsIgnoreCase("PROFILE")) {

            content.append("TABLE PROFILING REPORT\n\n");

            for (TableHealth table : tables) {

                content.append("Table: ")
                        .append(table.getTableName())
                        .append("\n");

                content.append("Columns: ")
                        .append(table.getColumnCount())
                        .append("\n");

                content.append("Rows: ")
                        .append(table.getRowCount())
                        .append("\n");

                content.append("----------------------\n");
            }
        }

        Files.write(
                reportFile,
                content.toString().getBytes()
        );

        ReportInfo report = new ReportInfo();

        report.setId(timestamp);
        report.setType("Database Health");
        report.setCreatedOn(
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                )
        );
        report.setStatus("SUCCESS");
        report.setFileName(fileName);

        long bytes = Files.size(reportFile);
        double kb = bytes / 1024.0;
        report.setSize(String.format("%.2f KB", kb));

        userReports
                .computeIfAbsent(userId, ignored -> new ArrayList<>())
                .add(0, report);

        return report;
    }

    public void deleteReport(int userId, String id) {
        List<ReportInfo> reports = userReports.get(userId);
        if (reports != null) {
            reports.removeIf(r -> r.getId().equals(id));
        }
    }
}
