package com.example.dbhealthtool.report;

import com.example.dbhealthtool.model.TableHealth;

public class SuggestionEngine {

    public void generateSuggestions(TableHealth table) {

        if (!table.isHasPrimaryKey()) {

            table.addSuggestion(
                    "Add a primary key to table: " +
                            table.getTableName()
            );
        }

        if (table.getIndexCount() == 0) {

            table.addSuggestion(
                    "Consider adding indexes for table: " +
                            table.getTableName()
            );
        }

        if (table.getColumnCount() > 10) {

            table.addSuggestion(
                    "Table has many columns. Check normalization."
            );
        }
    }
}