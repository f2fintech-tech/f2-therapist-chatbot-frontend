import { pgTable, text, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financialGoalsTable = pgTable("financial_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🎯"),
  current: numeric("current", { precision: 14, scale: 2 }).notNull().default("0"),
  target: numeric("target", { precision: 14, scale: 2 }).notNull().default("100"),
  color: text("color").notNull().default("brand"),
  unit: text("unit").notNull().default("₹"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinancialGoalSchema = createInsertSchema(financialGoalsTable).omit({ id: true, createdAt: true });
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type FinancialGoal = typeof financialGoalsTable.$inferSelect;
