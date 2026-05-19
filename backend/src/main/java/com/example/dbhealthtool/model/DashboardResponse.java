package com.example.dbhealthtool.model;

import java.util.List;

public class DashboardResponse {

    private DashboardSummary summary;

    private List<TableInfo> tables;

    private List<TableHealth> healthIssues;

    public DashboardResponse(
            DashboardSummary summary,
            List<TableInfo> tables,
            List<TableHealth> healthIssues) {

        this.summary = summary;
        this.tables = tables;
        this.healthIssues = healthIssues;
    }

    public DashboardSummary getSummary() {
        return summary;
    }

    public List<TableInfo> getTables() {
        return tables;
    }

    public List<TableHealth> getHealthIssues() {
        return healthIssues;
    }
}