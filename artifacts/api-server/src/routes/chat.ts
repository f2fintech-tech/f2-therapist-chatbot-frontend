import { Router, type IRouter } from "express";
import { db, chatMessagesTable, chatSessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  SendMessageBody,
  GetChatSessionsParams,
} from "@workspace/api-zod";
import { generateAIResponse } from "../lib/chatAI";

const router: IRouter = Router();

router.post("/v1/chat", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, session_id, user_id } = parsed.data;

  await db.insert(chatMessagesTable).values({
    sessionId: session_id,
    userId: user_id,
    role: "user",
    content: message,
  });

  const aiResponse = generateAIResponse(message);

  await db.insert(chatMessagesTable).values({
    sessionId: session_id,
    userId: user_id,
    role: "assistant",
    content: aiResponse.message,
    mood: aiResponse.mood,
    suggestions: aiResponse.suggestions,
  });

  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, session_id));

  if (existing.length === 0) {
    const title = message.length > 60 ? message.slice(0, 57) + "..." : message;
    const moodColor =
      aiResponse.mood.primary_emotion === "calm"
        ? "green"
        : aiResponse.mood.primary_emotion === "anxious"
          ? "amber"
          : "red";

    await db.insert(chatSessionsTable).values({
      id: session_id,
      userId: user_id,
      title,
      moodColor,
    });
  }

  res.json({
    message: aiResponse.message,
    session_id,
    mood: aiResponse.mood,
    suggestions: aiResponse.suggestions,
  });
});

router.get("/v1/chat/sessions/:user_id", async (req, res): Promise<void> => {
  const params = GetChatSessionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, params.data.user_id))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(10);

  res.json(
    sessions.map((s) => ({
      id: s.id,
      user_id: s.userId,
      title: s.title,
      created_at: s.createdAt.toISOString(),
      mood_color: s.moodColor,
    })),
  );
});

export default router;
