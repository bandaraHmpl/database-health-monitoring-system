package com.example.dbhealthtool.model;

import java.util.ArrayList;
import java.util.List;

public class TableHealth {

    private String tableName;

    private int columnCount;

    private boolean hasPrimaryKey;

    private int indexCount;

    private int rowCount;

    private int score;

    private List<String> warnings =
            new ArrayList<>();

    private List<String> suggestions =
            new ArrayList<>();

    public TableHealth() {
    }

    public TableHealth(String tableName) {

        this.tableName = tableName;
    }

    public String getTableName() {

        return tableName;
    }

    public void setTableName(String tableName) {

        this.tableName = tableName;
    }

    public int getColumnCount() {

        return columnCount;
    }

    public void setColumnCount(int columnCount) {

        this.columnCount = columnCount;
    }

    public boolean isHasPrimaryKey() {

        return hasPrimaryKey;
    }

    public void setHasPrimaryKey(
            boolean hasPrimaryKey
    ) {

        this.hasPrimaryKey = hasPrimaryKey;
    }

    public int getIndexCount() {

        return indexCount;
    }

    public void setIndexCount(int indexCount) {

        this.indexCount = indexCount;
    }

    public int getRowCount() {

        return rowCount;
    }

    public void setRowCount(int rowCount) {

        this.rowCount = rowCount;

        calculateScore();
    }

    public int getScore() {

        return score;
    }

    public String getStatus() {

        if (score >= 90) {

            return "Healthy";

        } else if (score >= 50) {

            return "Warning";

        } else {

            return "Critical";
        }
    }

    public void setScore(int score) {

        this.score = score;
    }

    public List<String> getWarnings() {

        return warnings;
    }

    public void addWarning(String warning) {

        warnings.add(warning);
    }

    public List<String> getSuggestions() {

        return suggestions;
    }

    public void addSuggestion(
            String suggestion
    ) {

        suggestions.add(suggestion);
    }

    private void calculateScore() {

        if (rowCount == 0) {

            this.score = 20;

        } else if (rowCount < 10) {

            this.score = 50;

        } else if (rowCount < 100) {

            this.score = 75;

        } else {

            this.score = 100;
        }
    }
}