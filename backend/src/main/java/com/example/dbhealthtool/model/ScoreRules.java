package com.example.dbhealthtool.model;

/**
 * Single source of truth for table scores and statuses.
 * Everything (scan, dashboard, reports) must use these rules so a table can
 * never be "Healthy" in one place and "Warning" in another.
 *
 *   rows        score   status
 *   0           20      Critical
 *   1 - 9       50      Warning
 *   10 - 99     85      Healthy
 *   100+        100     Healthy
 *
 *   score >= 80 -> Healthy,  score >= 50 -> Warning,  otherwise Critical
 *   (the dashboard chart tooltip uses the same 80 / 50 limits)
 */
public final class ScoreRules {

    public static final int HEALTHY_MIN = 80;
    public static final int WARNING_MIN = 50;

    private ScoreRules() {
    }

    public static int scoreForRows(int rowCount) {
        if (rowCount <= 0) return 20;
        if (rowCount < 10) return 50;
        if (rowCount < 100) return 85;
        return 100;
    }

    public static String statusForScore(int score) {
        if (score >= HEALTHY_MIN) return "Healthy";
        if (score >= WARNING_MIN) return "Warning";
        return "Critical";
    }

    public static String statusForRows(int rowCount) {
        return statusForScore(scoreForRows(rowCount));
    }
}
