import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const messagesTable = sqliteTable("messages_table", {
  id: int().primaryKey({ autoIncrement: true }),
  message: text().notNull(),
  timestamp: int({ mode: "timestamp" }).notNull(),
});
