package com.example.dbhealthtool.scanner;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import com.example.dbhealthtool.model.TableHealth;
import com.example.dbhealthtool.report.SuggestionEngine;
import java.sql.Statement;

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

    public List<TableHealth> scanTables() {

        List<TableHealth> tables =
                new ArrayList<>();

        try {

            List<String> tableNames =
                    getAllTableNames();

            Statement stmt =
                    connection.createStatement();

            for (String tableName : tableNames) {

                ResultSet rs =
                        stmt.executeQuery(
                                "SELECT COUNT(*) FROM `" + tableName + "`"
                        );

                int rowCount = 0;

                if (rs.next()) {

                    rowCount = rs.getInt(1);
                }

                TableHealth table =
                        new TableHealth();

                table.setTableName(tableName);

                table.setRowCount(rowCount);

                tables.add(table);
            }

        } catch (Exception e) {

            e.printStackTrace();
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