package com.example.dbhealthtool.model;

public class DashboardSummary {

    private int healthScore;
    private int totalTables;
    private int activeIssues;
    private int insights;

    public DashboardSummary(
            int healthScore,
            int totalTables,
            int activeIssues,
            int insights) {

        this.healthScore = healthScore;
        this.totalTables = totalTables;
        this.activeIssues = activeIssues;
        this.insights = insights;
    }

    public int getHealthScore() {
        return healthScore;
    }

    public int getTotalTables() {
        return totalTables;
    }

    public int getActiveIssues() {
        return activeIssues;
    }

    public int getInsights() {
        return insights;
    }
}