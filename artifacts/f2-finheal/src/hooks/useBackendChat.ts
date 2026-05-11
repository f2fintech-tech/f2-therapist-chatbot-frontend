import { useCallback, useEffect, useState } from "react";
import {
  getBackendHealth,
  sendBackendMessage,
  type BackendApiError,
  type BackendChatResponse,
  type BackendMoodDimensions,
} from "@/services/backend-chat";

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  mood?: { primary_emotion?: string; label?: string };
  time: string;
  suggestions?: string[];
}

interface UseBackendChatOptions {
  userId: string;
  onMoodUpdate?: (dims: BackendMoodDimensions) => void;
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as BackendApiError).message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while sending your message.";
}

function mapResponseToBotMessage(data: BackendChatResponse): ChatMessage {
  return {
    id: data.message_id,
    role: "bot",
    content: data.response,
    mood: data.mood
      ? {
          primary_emotion: data.mood.primary_emotion,
          label: data.mood.label,
        }
      : undefined,
    time: formatTime(),
    suggestions: [],
  };
}

export function useBackendChat({ userId, onMoodUpdate }: UseBackendChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const health = await getBackendHealth();
      setIsHealthy(health.status === "healthy");
    } catch {
      setIsHealthy(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        time: formatTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const data = await sendBackendMessage({
          message: trimmed,
          user_id: userId,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        });

        setConversationId(data.conversation_id);
        setMessages((prev) => [...prev, mapResponseToBotMessage(data)]);
        if (data.mood?.dimensions && onMoodUpdate) {
          onMoodUpdate(data.mood.dimensions);
        }
      } catch (err) {
        setError(buildErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, onMoodUpdate, userId],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    conversationId,
    isLoading,
    error,
    isHealthy,
    sendMessage,
    clearChat,
    checkHealth,
  };
}
