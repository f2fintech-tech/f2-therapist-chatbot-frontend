import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getBackendHealth,
  getConversationMessages,
  getConversations,
  formatMessageTimestamp,
  normalizeBackendError,
  sendChatMessage,
  updateConversationTitle,
  type BackendRequestError,
  type ChatMessage,
  type ConversationSummary,
  type MoodDimensions,
} from "@/lib/backendChat";

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
  startNewChatWithMessage: (message: string) => Promise<void>;
  stopSendingMessage: () => void;
  clearMessages: () => void;
  clearConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
}

function createUserMessage(content: string): ChatMessage {
  const timestamp = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    key: id,
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
    key: response.message_id,
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
    const sorted = [...nextConversations].sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
    setConversations(sorted);
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
        setError(normalizeBackendError(caughtError));
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
      const assistantMessageId = `assistant-${Date.now()}`;
      const initialAssistantMessage: ChatMessage = {
        id: assistantMessageId,
        key: assistantMessageId,
        role: "bot",
        content: "",
        time: formatMessageTimestamp(new Date().toISOString()),
        timestamp: new Date().toISOString(),
      };

      setMessages((currentMessages) => [...currentMessages, optimisticMessage, initialAssistantMessage]);
      setIsSendingMessage(true);
      setError(null);

      try {
        let accumulatedContent = "";
        let finalMetadata: any = null;

        await sendChatMessage({
          message: trimmedMessage,
          user_id: userId,
          conversation_id: conversationId ?? undefined,
        }, (chunk) => {
          if (chunk.type === "token") {
            accumulatedContent += chunk.content;
            setMessages((currentMessages) =>
              currentMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          } else if (chunk.type === "metadata") {
            finalMetadata = chunk;
          } else if (chunk.type === "error") {
            throw new Error(chunk.message);
          }
        }, controller.signal);

        if (finalMetadata) {
          setConversationId(finalMetadata.conversation_id);
          setMessages((currentMessages) => {
            const next = currentMessages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    id: finalMetadata.message_id,
                    content: accumulatedContent || finalMetadata.response,
                    mood: finalMetadata.mood,
                    suggestions: finalMetadata.suggestions,
                    timestamp: finalMetadata.timestamp,
                    time: formatMessageTimestamp(finalMetadata.timestamp),
                  }
                : msg
            );
            return next;
          });
        }

        await refreshConversations();
      } catch (caughtError) {
        const normalizedError = normalizeBackendError(caughtError);
        setMessages((currentMessages) => currentMessages.filter((entry) => entry.id !== optimisticMessage.id && entry.id !== assistantMessageId));

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

        // Load conversations from database
        const nextConversations = await getConversations(userId).catch(() => []);
        const sorted = [...nextConversations].sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
        setConversations(sorted);

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

  const startNewChatWithMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || !userId) {
        return;
      }

      // Abort any active request first
      activeSendControllerRef.current?.abort();
      activeSendControllerRef.current = null;

      // Reset conversation/messages state for a fresh start
      setMessages([]);
      setConversationId(null);
      setError(null);
      setIsLoading(false);
      setIsSendingMessage(true);

      const controller = new AbortController();
      activeSendControllerRef.current = controller;
      const optimisticMessage = createUserMessage(trimmedMessage);
      const assistantMessageId = `assistant-${Date.now()}`;
      const initialAssistantMessage: ChatMessage = {
        id: assistantMessageId,
        key: assistantMessageId,
        role: "bot",
        content: "",
        time: formatMessageTimestamp(new Date().toISOString()),
        timestamp: new Date().toISOString(),
      };

      setMessages([optimisticMessage, initialAssistantMessage]);

      try {
        let accumulatedContent = "";
        let finalMetadata: any = null;

        await sendChatMessage(
          {
            message: trimmedMessage,
            user_id: userId,
            conversation_id: undefined, // Force undefined to start a new conversation
          },
          (chunk) => {
            if (chunk.type === "token") {
              accumulatedContent += chunk.content;
              setMessages((currentMessages) =>
                currentMessages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            } else if (chunk.type === "metadata") {
              finalMetadata = chunk;
            } else if (chunk.type === "error") {
              throw new Error(chunk.message);
            }
          },
          controller.signal
        );

        if (finalMetadata) {
          setConversationId(finalMetadata.conversation_id);
          setMessages((currentMessages) => {
            const next = currentMessages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    id: finalMetadata.message_id,
                    content: accumulatedContent || finalMetadata.response,
                    mood: finalMetadata.mood,
                    suggestions: finalMetadata.suggestions,
                    timestamp: finalMetadata.timestamp,
                    time: formatMessageTimestamp(finalMetadata.timestamp),
                  }
                : msg
            );
            return next;
          });
        }

        await refreshConversations();
      } catch (caughtError) {
        const normalizedError = normalizeBackendError(caughtError);
        // Clear optimistic message if request was cancelled or failed
        setMessages([]);

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
    [refreshConversations, userId]
  );

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

  const renameConversation = useCallback(
    async (nextConversationId: string, title: string) => {
      if (!userId || !nextConversationId) {
        return;
      }

      setConversations((current) =>
        current.map((c) => (c.id === nextConversationId ? { ...c, title } : c))
      );

      try {
        await updateConversationTitle(nextConversationId, userId, title);
      } catch (caughtError) {
        await refreshConversations();
        setError(normalizeBackendError(caughtError));
      }
    },
    [refreshConversations, userId]
  );

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
    startNewChatWithMessage,
    stopSendingMessage,
    clearMessages,
    clearConversation,
    loadConversation,
    refreshConversations,
    renameConversation,
  };
}
