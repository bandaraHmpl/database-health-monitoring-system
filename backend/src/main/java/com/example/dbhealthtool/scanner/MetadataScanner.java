package com.example.dbhealthtool.scanner;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import com.example.dbhealthtool.model.TableHealth;
import com.example.dbhealthtool.report.SuggestionEngine;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import com.example.dbhealthtool.model.TableInfo;

public class MetadataScanner {

    private final Connection connection;

    public MetadataScanner(Connection connection) {
        this.connection = connection;
    }

    private TableHealth analyzeTable(
            DatabaseMetaData metaData,
            String tableName) throws Exception {

        TableHealth tableHealth =
                new TableHealth(tableName);

        ResultSet columns =
                metaData.getColumns(
                        connection.getCatalog(),
                        null,
                        tableName,
                        null
                );

        int columnCount = 0;

        while (columns.next()) {
            columnCount++;
        }

        tableHealth.setColumnCount(columnCount);

        ResultSet primaryKeys =
                metaData.getPrimaryKeys(
                        connection.getCatalog(),
                        null,
                        tableName
                );

        boolean hasPrimaryKey =
                primaryKeys.next();

        tableHealth.setHasPrimaryKey(hasPrimaryKey);

        if (!hasPrimaryKey) {

            tableHealth.addWarning(
                    "Missing primary key"
            );
        }

        ResultSet indexes =
                metaData.getIndexInfo(
                        connection.getCatalog(),
                        null,
                        tableName,
                        false,
                        false
                );

        int indexCount = 0;

        while (indexes.next()) {

            String indexName =
                    indexes.getString("INDEX_NAME");

            if (indexName != null) {
                indexCount++;
            }
        }

        tableHealth.setIndexCount(indexCount);

        if (indexCount == 0) {

            tableHealth.addWarning(
                    "No indexes found"
            );
        }

        SuggestionEngine engine =
                new SuggestionEngine();

        engine.generateSuggestions(tableHealth);

        return tableHealth;
    }

    public List<TableHealth> scanDatabase() {

        List<TableHealth> tableHealthList =
                new ArrayList<>();

        try {

            DatabaseMetaData metaData =
                    connection.getMetaData();

            ResultSet tables =
                    metaData.getTables(
                            connection.getCatalog(),
                            null,
                            "%",
                            new String[]{"TABLE"}
                    );

            while (tables.next()) {

                String tableName =
                        tables.getString("TABLE_NAME");

                TableHealth tableHealth =
                        analyzeTable(metaData, tableName);

                tableHealthList.add(tableHealth);
            }

        } catch (Exception e) {

            e.printStackTrace();
        }

        return tableHealthList;
    }

    /**
     * Tables whose estimated row count (from information_schema) is below this
     * are counted exactly with COUNT(*) - it is cheap for small tables and the
     * health thresholds (0 / <10 / <100 rows) need exact numbers. Larger tables
     * use the estimate, which avoids slow full-table COUNT(*) scans.
     */
    private static final int EXACT_COUNT_BELOW = 10_000;
    private static final int BATCH_SIZE = 50;

    /**
     * Row counts for every base table in the current database, using one
     * information_schema query plus batched COUNT(*) for small tables
     * (instead of one query per table).
     */
    public List<TableInfo> getTableRowCounts() throws SQLException {

        Map<String, Long> estimates = new LinkedHashMap<>();

        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT TABLE_NAME, COALESCE(TABLE_ROWS, 0) "
                             + "FROM information_schema.TABLES "
                             + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' "
                             + "ORDER BY TABLE_NAME")) {

            while (rs.next()) {
                estimates.put(rs.getString(1), rs.getLong(2));
            }
        }

        Map<String, Long> counts = new HashMap<>(estimates);

        List<String> needExact = new ArrayList<>();
        for (Map.Entry<String, Long> e : estimates.entrySet()) {
            if (e.getValue() < EXACT_COUNT_BELOW) {
                needExact.add(e.getKey());
            }
        }

        for (int i = 0; i < needExact.size(); i += BATCH_SIZE) {
            countExact(
                    needExact.subList(i, Math.min(i + BATCH_SIZE, needExact.size())),
                    counts
            );
        }

        List<TableInfo> result = new ArrayList<>();
        for (String name : estimates.keySet()) {
            long rows = counts.getOrDefault(name, 0L);
            result.add(new TableInfo(name, (int) Math.min(rows, Integer.MAX_VALUE)));
        }
        return result;
    }

    private void countExact(List<String> batch, Map<String, Long> counts) {

        StringBuilder sql = new StringBuilder();
        for (int i = 0; i < batch.size(); i++) {
            if (i > 0) {
                sql.append(" UNION ALL ");
            }
            sql.append("SELECT ").append(i).append(" AS idx, COUNT(*) AS cnt FROM `")
                    .append(batch.get(i).replace("`", "``"))
                    .append("`");
        }

        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(sql.toString())) {

            while (rs.next()) {
                counts.put(batch.get(rs.getInt(1)), rs.getLong(2));
            }
            return;

        } catch (SQLException batchFailure) {
            // One bad table breaks the whole UNION - fall back to one by one
        }

        for (String table : batch) {
            try (Statement st = connection.createStatement();
                 ResultSet rs = st.executeQuery(
                         "SELECT COUNT(*) FROM `" + table.replace("`", "``") + "`")) {

                if (rs.next()) {
                    counts.put(table, rs.getLong(1));
                }
            } catch (SQLException e) {
                System.out.println("Could not count rows of " + table + ", using estimate");
            }
        }
    }

    /**
     * Per-table health data for reports: rows, columns, primary key and index
     * count - fetched with 3 bulk queries (not per table).
     */
    public List<TableHealth> scanTables() throws SQLException {

        List<TableHealth> tables = new ArrayList<>();

        {
            Map<String, Integer> columns = new HashMap<>();
            try (Statement st = connection.createStatement();
                 ResultSet rs = st.executeQuery(
                         "SELECT TABLE_NAME, COUNT(*) FROM information_schema.COLUMNS "
                                 + "WHERE TABLE_SCHEMA = DATABASE() GROUP BY TABLE_NAME")) {
                while (rs.next()) {
                    columns.put(rs.getString(1), rs.getInt(2));
                }
            }

            // value = {index count, has primary key (0/1)}
            Map<String, int[]> indexes = new HashMap<>();
            try (Statement st = connection.createStatement();
                 ResultSet rs = st.executeQuery(
                         "SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME), "
                                 + "MAX(CASE WHEN INDEX_NAME = 'PRIMARY' THEN 1 ELSE 0 END) "
                                 + "FROM information_schema.STATISTICS "
                                 + "WHERE TABLE_SCHEMA = DATABASE() GROUP BY TABLE_NAME")) {
                while (rs.next()) {
                    indexes.put(rs.getString(1), new int[]{rs.getInt(2), rs.getInt(3)});
                }
            }

            SuggestionEngine engine = new SuggestionEngine();

            for (TableInfo info : getTableRowCounts()) {
                String name = info.getTableName();

                TableHealth table = new TableHealth(name);
                table.setRowCount(info.getRowCount());
                table.setColumnCount(columns.getOrDefault(name, 0));

                int[] idx = indexes.get(name);
                table.setIndexCount(idx == null ? 0 : idx[0]);
                table.setHasPrimaryKey(idx != null && idx[1] == 1);

                if (!table.isHasPrimaryKey()) {
                    table.addWarning("Missing primary key");
                }
                if (table.getIndexCount() == 0) {
                    table.addWarning("No indexes found");
                }

                engine.generateSuggestions(table);
                tables.add(table);
            }

        }

        return tables;
    }

    public List<String> getAllTableNames() {

        List<String> tables = new ArrayList<>();

        try {

            DatabaseMetaData metaData =
                    connection.getMetaData();

            ResultSet rs = metaData.getTables(
                    connection.getCatalog(),
                    null,
                    "%",
                    new String[]{"TABLE"}
            );

            while (rs.next()) {

                String tableName =
                        rs.getString("TABLE_NAME");

                tables.add(tableName);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return tables;
    }
}