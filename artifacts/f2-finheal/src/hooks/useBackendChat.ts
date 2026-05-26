import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getBackendHealth,
  getConversationMessages,
  getConversations,
  formatMessageTimestamp,
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
  isSendingMessage: boolean;
  error: BackendRequestError | null;
  heartsExhausted: boolean;
  conversationId: string | null;
  isHealthy: boolean | null;
  conversations: ConversationSummary[];
  conversationCount: number;
  sendMessage: (message: string) => Promise<void>;
  stopSendingMessage: () => void;
  clearMessages: () => void;
  clearConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

function createUserMessage(content: string): ChatMessage {
  const timestamp = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: "user",
    content,
    timestamp,
    time: formatMessageTimestamp(timestamp),
  };
}

function createAssistantMessage(response: {
  message_id: string;
  response: string;
  timestamp: string;
  mood?: { primary_emotion?: string; label?: string; dimensions?: MoodDimensions };
  suggestions?: string[];
}): ChatMessage {
  // Use browser's local time for consistency with user messages
  const timestamp = new Date().toISOString();
  return {
    id: response.message_id,
    role: "bot",
    content: response.response,
    timestamp,
    time: formatMessageTimestamp(timestamp),
    mood: response.mood,
    suggestions: response.suggestions,
  };
}

export function useBackendChat(userId: string): UseBackendChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<BackendRequestError | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [heartsExhausted, setHeartsExhausted] = useState(false);
  const bootstrappedUserId = useRef<string | null>(null);
  const activeSendControllerRef = useRef<AbortController | null>(null);

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
      if (!trimmedMessage || !userId || isSendingMessage) {
        return;
      }

      const controller = new AbortController();
      activeSendControllerRef.current = controller;
      const optimisticMessage = createUserMessage(trimmedMessage);
      setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
      setIsSendingMessage(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          message: trimmedMessage,
          user_id: userId,
          conversation_id: conversationId ?? undefined,
        }, controller.signal);

        setConversationId(response.conversation_id);
        const assistantMsg = createAssistantMessage(response);
        const conversationTitle = response.title?.trim() || trimmedMessage.substring(0, 60).trim();
        setMessages((currentMessages) => {
          const next = [...currentMessages, assistantMsg];
          // Persist to localStorage as fallback
          try {
            upsertLocalConversation(response.conversation_id, userId, next, conversationTitle);
          } catch {}
          return next;
        });

        await refreshConversations();
      } catch (caughtError) {
        const normalizedError = normalizeBackendError(caughtError);
        setMessages((currentMessages) => currentMessages.filter((entry) => entry.id !== optimisticMessage.id));

        if (normalizedError.code !== "cancelled") {
          if (normalizedError.message.includes("402") || normalizedError.message.includes("Not enough hearts")) {
            setHeartsExhausted(true);
          } else {
            setError(normalizedError);
          }
        } else {
          setError(null);
        }
      } finally {
        if (activeSendControllerRef.current === controller) {
          activeSendControllerRef.current = null;
        }
        setIsSendingMessage(false);
      }
    },
    [conversationId, isSendingMessage, refreshConversations, userId],
  );

  const stopSendingMessage = useCallback(() => {
    activeSendControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      setHeartsExhausted(false);

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
        // Check health but don't fail if it's down - use localStorage fallback
        const healthyResult = await getBackendHealth().catch(() => false);
        
        if (isCancelled) {
          return;
        }

        setIsHealthy(healthyResult);

        // Load conversations with localStorage fallback (handles backend failure gracefully)
        const nextConversations = await getConversations(userId).catch(() => []);
        const local = listLocalConversations(userId);
        const merged = [...local, ...nextConversations].reduce<ConversationSummary[]>((acc, cur) => {
          if (!acc.find((c) => c.id === cur.id)) acc.push(cur);
          return acc;
        }, []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        setConversations(merged);

        if (isCancelled) {
          return;
        }

        // Don't auto-load a conversation - show home page instead
        // User must select a conversation from the list on the right
        setConversationId(null);
        setMessages([]);
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

  const clearConversation = useCallback(() => {
    activeSendControllerRef.current?.abort();
    activeSendControllerRef.current = null;
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsLoading(false);
    setIsSendingMessage(false);
  }, []);

  return {
    messages,
    isLoading,
    isSendingMessage,
    error,
    heartsExhausted,
    conversationId,
    isHealthy,
    conversations,
    conversationCount,
    sendMessage,
    stopSendingMessage,
    clearMessages,
    clearConversation,
    loadConversation,
    refreshConversations,
  };
}
