import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { SendMessagePayload } from '../types/chat';
import { generateId } from '../utils/helpers';

export const useChat = () => {
  const {
    conversations,
    activeConversation,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    fetchConversations,
    fetchConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    addOptimisticMessage,
    setActiveConversation,
    clearError,
  } = useChatStore();

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const conversationId = activeConversation?.id;

      // Add optimistic user message
      const optimisticMessage = {
        id: generateId(),
        conversationId: conversationId || '',
        role: 'user' as const,
        content,
        timestamp: new Date().toISOString(),
        status: 'sending' as const,
      };
      addOptimisticMessage(optimisticMessage);

      const payload: SendMessagePayload = {
        conversationId,
        content,
      };

      await sendMessage(payload);
    },
    [activeConversation, addOptimisticMessage, sendMessage]
  );

  const handleNewConversation = useCallback(async () => {
    const conversation = await createConversation();
    return conversation;
  }, [createConversation]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      await fetchConversation(conversationId);
    },
    [fetchConversation]
  );

  return {
    conversations,
    activeConversation,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    fetchConversations,
    selectConversation: handleSelectConversation,
    createConversation: handleNewConversation,
    deleteConversation,
    sendMessage: handleSendMessage,
    setActiveConversation,
    clearError,
  };
};
