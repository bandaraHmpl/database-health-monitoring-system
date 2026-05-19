package com.example.dbhealthtool.model;

public class HealthSnapshot {

    private String date;
    private int score;

    public HealthSnapshot() {
    }

    public HealthSnapshot(
            String date,
            int score
    ) {
        this.date = date;
        this.score = score;
    }

    public String getDate() {
        return date;
    }

    public int getScore() {
        return score;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void setScore(int score) {
        this.score = score;
    }
}