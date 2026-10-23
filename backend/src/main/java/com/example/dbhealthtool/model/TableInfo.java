package com.example.dbhealthtool.model;

public class TableInfo {

    private String tableName;
    private int rowCount;
    private boolean empty;
    private boolean largeTable;
    private String status;

    public TableInfo(String tableName, int rowCount) {

        this.tableName = tableName;
        setRowCount(rowCount);
    }

    public String getTableName() {
        return tableName;
    }

    public int getRowCount() {
        return rowCount;
    }

    public boolean isEmpty() {
        return empty;
    }

    public boolean isLargeTable() {
        return largeTable;
    }

    public String getStatus() {
        return status;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public void setRowCount(int rowCount) {

        this.rowCount = rowCount;

        this.empty = rowCount == 0;

        this.largeTable = rowCount > 1000;

        this.status = ScoreRules.statusForRows(rowCount);
    }
}