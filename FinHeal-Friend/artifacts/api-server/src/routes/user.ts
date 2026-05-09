import { Router, type IRouter } from "express";
import { db, wellnessScoresTable, financialGoalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetWellnessScoreParams,
  GetUserGoalsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/v1/user/:id/wellness-score", async (req, res): Promise<void> => {
  const params = GetWellnessScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [score] = await db
    .select()
    .from(wellnessScoresTable)
    .where(eq(wellnessScoresTable.userId, params.data.id));

  if (!score) {
    res.status(404).json({ error: "Wellness score not found" });
    return;
  }

  res.json({
    score: score.score,
    label: score.label,
    change_pts: score.changePts,
    trend: score.trend,
    session_count: score.sessionCount,
    goals_count: score.goalsCount,
    active_days: score.activeDays,
  });
});

router.get("/v1/user/:id/goals", async (req, res): Promise<void> => {
  const params = GetUserGoalsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const goals = await db
    .select()
    .from(financialGoalsTable)
    .where(eq(financialGoalsTable.userId, params.data.id));

  res.json(
    goals.map((g) => ({
      id: g.id,
      user_id: g.userId,
      name: g.name,
      icon: g.icon,
      current: parseFloat(g.current),
      target: parseFloat(g.target),
      color: g.color,
      unit: g.unit,
    })),
  );
});

export default router;
