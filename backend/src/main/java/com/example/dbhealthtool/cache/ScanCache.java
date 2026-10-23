package com.example.dbhealthtool.cache;

import com.example.dbhealthtool.model.HealthSnapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ScanCache {

    private static final Map<Integer, Map<String, Object>> userScans =
            new ConcurrentHashMap<>();

    private static final Map<Integer, List<HealthSnapshot>> userScanHistory =
            new ConcurrentHashMap<>();

    private ScanCache() {
    }

    public static void setLatestScan(int userId, Map<String, Object> data) {
        userScans.put(userId, normalize(data));
    }

    public static Map<String, Object> getLatestScan(int userId) {
        Map<String, Object> scan = userScans.get(userId);
        if (scan != null && hasData(scan)) {
            return new HashMap<>(scan);
        }
        return emptyScan();
    }

    public static boolean hasCachedScan(int userId) {
        Map<String, Object> scan = userScans.get(userId);
        return scan != null && hasData(scan);
    }

    public static void restoreScan(int userId, Map<String, Object> data) {
        if (data != null && hasData(data)) {
            userScans.put(userId, normalize(data));
            restoreHistoryFromPayload(userId, data);
        }
    }

    @SuppressWarnings("unchecked")
    private static void restoreHistoryFromPayload(
            int userId,
            Map<String, Object> data
    ) {
        Object historyObj = data.get("scanHistory");
        if (!(historyObj instanceof List<?> list) || list.isEmpty()) {
            return;
        }

        List<HealthSnapshot> history = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Object dateValue = map.get("date");
                if (dateValue == null) {
                    dateValue = map.get("Date");
                }
                Object scoreValue = map.get("score");
                if (scoreValue == null) {
                    scoreValue = map.get("Score");
                }
                history.add(
                        new HealthSnapshot(
                                String.valueOf(dateValue),
                                toInt(scoreValue)
                        )
                );
            }
        }

        if (!history.isEmpty()) {
            userScanHistory.put(userId, history);
        }
    }

    public static List<HealthSnapshot> getScanHistory(int userId) {
        return new ArrayList<>(
                userScanHistory.getOrDefault(userId, new ArrayList<>())
        );
    }

    public static void updateScanHistory(int userId, List<HealthSnapshot> history) {
        userScanHistory.put(userId, new ArrayList<>(history));
    }

    public static void clearUser(int userId) {
        userScans.remove(userId);
        userScanHistory.remove(userId);
    }

    private static boolean hasData(Map<String, Object> scan) {
        return scan != null
                && "success".equals(scan.get("status"))
                && scan.containsKey("summary");
    }

    public static Map<String, Object> emptyScan() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "empty");

        Map<String, Object> summary = new HashMap<>();
        summary.put("healthScore", 0);
        summary.put("totalTables", 0);
        summary.put("activeIssues", 0);
        summary.put("insights", 0);
        response.put("summary", summary);

        response.put("tables", new ArrayList<>());
        response.put("tableHealth", new ArrayList<>());
        response.put("issues", new ArrayList<>());
        response.put("suggestions", new ArrayList<>());
        response.put("distribution", defaultDistribution(0, 0, 0));
        response.put("scanHistory", new ArrayList<>());

        return response;
    }

    private static Map<String, Object> normalize(Map<String, Object> data) {
        Map<String, Object> normalized = new HashMap<>();

        if (data == null) {
            return emptyScan();
        }

        normalized.put("status", data.getOrDefault("status", "success"));

        Object summaryObj = data.get("summary");
        Map<String, Object> summary = new HashMap<>();
        if (summaryObj instanceof Map<?, ?> summaryMap) {
            summary.put("healthScore", toInt(summaryMap.get("healthScore")));
            summary.put("totalTables", toInt(summaryMap.get("totalTables")));
            summary.put("activeIssues", toInt(summaryMap.get("activeIssues")));
            summary.put("insights", toInt(summaryMap.get("insights")));
        } else {
            summary.put("healthScore", 0);
            summary.put("totalTables", 0);
            summary.put("activeIssues", 0);
            summary.put("insights", 0);
        }
        normalized.put("summary", summary);

        normalized.put("tables", copyList(data.get("tables")));
        normalized.put("tableHealth", copyList(data.get("tableHealth")));
        normalized.put("issues", copyList(data.get("issues")));
        normalized.put("suggestions", copyStringList(data.get("suggestions")));
        normalized.put("scanHistory", copyList(data.get("scanHistory")));

        List<Map<String, Object>> distribution = copyList(data.get("distribution"));
        if (distribution.isEmpty()) {
            int healthy = toInt(summary.get("insights"));
            int issues = toInt(summary.get("activeIssues"));
            int total = toInt(summary.get("totalTables"));
            int warning = Math.max(0, total - healthy - issues);
            distribution = defaultDistribution(healthy, warning, issues);
        }
        normalized.put("distribution", distribution);

        if (data.containsKey("message")) {
            normalized.put("message", data.get("message"));
        }

        return normalized;
    }

    private static List<Map<String, Object>> defaultDistribution(
            int healthy,
            int warning,
            int critical
    ) {
        List<Map<String, Object>> distribution = new ArrayList<>();

        Map<String, Object> healthyEntry = new HashMap<>();
        healthyEntry.put("name", "Healthy");
        healthyEntry.put("value", healthy);
        distribution.add(healthyEntry);

        Map<String, Object> warningEntry = new HashMap<>();
        warningEntry.put("name", "Warning");
        warningEntry.put("value", warning);
        distribution.add(warningEntry);

        Map<String, Object> criticalEntry = new HashMap<>();
        criticalEntry.put("name", "Critical");
        criticalEntry.put("value", critical);
        distribution.add(criticalEntry);

        return distribution;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copyList(Object value) {
        if (!(value instanceof List<?> list)) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> copy = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                copy.add(new HashMap<>((Map<String, Object>) map));
            } else {
                copy.add(new HashMap<>());
            }
        }
        return copy;
    }

    private static List<String> copyStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return new ArrayList<>();
        }

        List<String> copy = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                copy.add(String.valueOf(item));
            }
        }
        return copy;
    }

    private static int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str) {
            try {
                return Integer.parseInt(str);
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
        return 0;
    }
}
