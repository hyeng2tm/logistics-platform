package com.logistics.auth.config;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;
import org.hibernate.engine.jdbc.internal.BasicFormatterImpl;

import java.util.Locale;

public class P6SpyFormatter implements MessageFormattingStrategy {

    private static final BasicFormatterImpl FORMATTER = new BasicFormatterImpl();

    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category, String prepared,
            String sql, String url) {
        if (!Category.STATEMENT.getName().equals(category)) {
            return null;
        }
        String finalSql = (sql != null && !sql.trim().isEmpty()) ? sql : prepared;
        finalSql = formatSql(category, finalSql);

        if (finalSql == null || finalSql.trim().isEmpty()) {
            return null;
        }

        return String.format("\n[P6Spy-Auth] | %d ms | %s\n%s", elapsed, category, finalSql);
    }

    private String formatSql(String category, String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            return sql;
        }

        if (Category.STATEMENT.getName().equals(category)) {
            String trimmedSql = sql.trim().toLowerCase(Locale.ROOT);
            if (trimmedSql.startsWith("create") || trimmedSql.startsWith("alter") || trimmedSql.startsWith("comment")) {
                return FORMATTER.format(sql);
            } else {
                return separateCommentAndFormat(sql);
            }
        }

        return sql;
    }

    private String separateCommentAndFormat(String sql) {
        if (sql.startsWith("/*")) {
            int commentEndIndex = sql.indexOf("*/");
            if (commentEndIndex != -1) {
                String comment = sql.substring(0, commentEndIndex + 2);
                String query = sql.substring(commentEndIndex + 2);
                return comment + "\n" + FORMATTER.format(query);
            }
        }
        return FORMATTER.format(sql);
    }
}
