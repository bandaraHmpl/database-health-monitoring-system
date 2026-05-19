package com.example.dbhealthtool.cache;

import java.util.HashMap;
import java.util.Map;

public class ScanCache {

    private static Map<String, Object> latestScan = new HashMap<>();

    public static void setLatestScan(Map<String, Object> data) {
        latestScan = data;
    }

    public static Map<String, Object> getLatestScan() {
        return latestScan;
    }

    public static boolean hasData() {
        return latestScan != null && !latestScan.isEmpty();
    }
}