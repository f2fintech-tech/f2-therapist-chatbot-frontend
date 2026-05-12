import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getBackendHealth,
  getConversationMessages,
  getConversations,
  normalizeBackendError,
  sendChatMessage,
  type BackendRequestError,
  type ChatMessage,
  type ConversationSummary,
  type MoodDimensions,
} from "@/lib/backendChat";
import { listLocalConversations, upsertLocalConversation, getLocalConversationMessages } from "@/utils/localConversations";

export interface UseBackendChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: BackendRequestError | null;
  conversationId: string | null;
  isHealthy: boolean | null;
  conversations: ConversationSummary[];
  conversationCount: number;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

function toTimeString(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createUserMessage(content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: "user",
    content,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function createAssistantMessage(response: {
  message_id: string;
  response: string;
  timestamp: string;
  mood?: { primary_emotion?: string; label?: string; dimensions?: MoodDimensions };
  suggestions?: string[];
}): ChatMessage {
  return {
    id: response.message_id,
    role: "bot",
    content: response.response,
    time: toTimeString(response.timestamp),
    mood: response.mood,
    suggestions: response.suggestions,
  };
}

export function useBackendChat(userId: string): UseBackendChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<BackendRequestError | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const bootstrappedUserId = useRef<string | null>(null);

  const conversationCount = useMemo(() => conversations.length, [conversations]);

  const refreshConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      return;
    }

    const nextConversations = await getConversations(userId).catch(() => []);
    // Merge in any locally-saved conversations (localStorage) so user doesn't lose recent chats when backend absent
    const local = listLocalConversations(userId);
    const merged = [...local, ...nextConversations].reduce<ConversationSummary[]>((acc, cur) => {
      if (!acc.find((c) => c.id === cur.id)) acc.push(cur);
      return acc;
    }, []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    setConversations(merged);
    return;
  }, [userId]);

  const loadConversation = useCallback(
    async (nextConversationId: string) => {
      if (!userId || !nextConversationId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextMessages = await getConversationMessages(nextConversationId, userId);
        setMessages(nextMessages);
        setConversationId(nextConversationId);
        await refreshConversations();
      } catch (caughtError) {
        // Try local fallback if backend messages are unavailable
        const localMsgs = getLocalConversationMessages(nextConversationId, userId);
        if (localMsgs && localMsgs.length > 0) {
          setMessages(localMsgs);
          setConversationId(nextConversationId);
          await refreshConversations();
        } else {
          setError(normalizeBackendError(caughtError));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refreshConversations, userId],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || !userId) {
        return;
      }

      const optimisticMessage = createUserMessage(trimmedMessage);
      setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          message: trimmedMessage,
          user_id: userId,
          conversation_id: conversationId ?? undefined,
        });

          setConversationId(response.conversation_id);
          const assistantMsg = createAssistantMessage(response);
          setMessages((currentMessages) => {
            const next = [...currentMessages, assistantMsg];
            // Persist to localStorage as fallback
            try {
              upsertLocalConversation(response.conversation_id, userId, next, undefined);
            } catch {}
            return next;
          });

          await refreshConversations();
      } catch (caughtError) {
        setMessages((currentMessages) => currentMessages.filter((entry) => entry.id !== optimisticMessage.id));
        setError(normalizeBackendError(caughtError));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, refreshConversations, userId],
  );

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      if (!userId) {
        setMessages([]);
        setConversations([]);
        setConversationId(null);
        setError(null);
        setIsHealthy(null);
        return;
      }

      if (bootstrappedUserId.current === userId) {
        return;
      }

      bootstrappedUserId.current = userId;
      setIsLoading(true);
      setError(null);

      try {
        const [healthyResult, nextConversations] = await Promise.all([
          getBackendHealth(),
          getConversations(userId),
        ]);

        if (isCancelled) {
          return;
        }

        setIsHealthy(healthyResult);
        // merge local conversations into the initial list
        const local = listLocalConversations(userId);
        const merged = [...local, ...nextConversations].reduce<ConversationSummary[]>((acc, cur) => {
          if (!acc.find((c) => c.id === cur.id)) acc.push(cur);
          return acc;
        }, []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        setConversations(merged);

        const latestConversation = merged[0];
        if (latestConversation) {
          const nextMessages = await getConversationMessages(latestConversation.id, userId);
          if (isCancelled) {
            return;
          }

          setConversationId(latestConversation.id);
          setMessages(nextMessages);
        } else {
          setConversationId(null);
          // attempt to load most recent local conversation if any
          const localOnly = listLocalConversations(userId);
          if (localOnly.length > 0) {
            const first = localOnly[0];
            const msgs = getLocalConversationMessages(first.id, userId);
            setConversationId(first.id);
            setMessages(msgs);
          } else {
            setMessages([]);
          }
        }
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setIsHealthy(false);
        setError(normalizeBackendError(caughtError));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    isHealthy,
    conversations,
    conversationCount,
    sendMessage,
    clearMessages,
    loadConversation,
    refreshConversations,
  };
}
