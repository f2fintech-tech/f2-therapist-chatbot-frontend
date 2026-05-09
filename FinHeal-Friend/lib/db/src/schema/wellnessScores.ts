import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wellnessScoresTable = pgTable("wellness_scores", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  score: integer("score").notNull().default(68),
  label: text("label").notNull().default("GOOD"),
  changePts: integer("change_pts").notNull().default(4),
  trend: text("trend").notNull().default("up"),
  sessionCount: integer("session_count").notNull().default(7),
  goalsCount: integer("goals_count").notNull().default(3),
  activeDays: integer("active_days").notNull().default(12),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWellnessScoreSchema = createInsertSchema(wellnessScoresTable).omit({ updatedAt: true });
export type InsertWellnessScore = z.infer<typeof insertWellnessScoreSchema>;
export type WellnessScore = typeof wellnessScoresTable.$inferSelect;
