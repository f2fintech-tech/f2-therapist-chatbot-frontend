import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { chatService } from '../services/chatService';
import { Conversation, ConversationSummary, Message, SendMessagePayload } from '../types/chat';

interface ChatState {
  conversations: ConversationSummary[];
  activeConversation: Conversation | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  addOptimisticMessage: (message: Message) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      activeConversation: null,
      isLoadingConversations: false,
      isLoadingMessages: false,
      isSendingMessage: false,
      error: null,

      fetchConversations: async () => {
        set({ isLoadingConversations: true, error: null });
        try {
          const response = await chatService.getConversations();
          set({ conversations: response.data, isLoadingConversations: false });
        } catch (err) {
          set({
            error: (err as { message: string }).message,
            isLoadingConversations: false,
          });
        }
      },

      fetchConversation: async (id: string) => {
        set({ isLoadingMessages: true, error: null });
        try {
          const response = await chatService.getConversation(id);
          set({ activeConversation: response.data, isLoadingMessages: false });
        } catch (err) {
          set({
            error: (err as { message: string }).message,
            isLoadingMessages: false,
          });
        }
      },

      createConversation: async (title?: string) => {
        try {
          const response = await chatService.createConversation(title);
          const conversation = response.data;
          const summary: ConversationSummary = {
            id: conversation.id,
            title: conversation.title,
            messageCount: 0,
          };
          set((state) => ({
            conversations: [summary, ...state.conversations],
            activeConversation: conversation,
          }));
          return conversation;
        } catch (err) {
          set({ error: (err as { message: string }).message });
          return null;
        }
      },

      deleteConversation: async (id: string) => {
        try {
          await chatService.deleteConversation(id);
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
            activeConversation:
              state.activeConversation?.id === id ? null : state.activeConversation,
          }));
        } catch (err) {
          set({ error: (err as { message: string }).message });
        }
      },

      sendMessage: async (payload: SendMessagePayload) => {
        set({ isSendingMessage: true, error: null });
        try {
          const response = await chatService.sendMessage(payload);
          const { assistantMessage, conversationId } = response.data;
          const { activeConversation } = get();

          if (activeConversation && activeConversation.id === conversationId) {
            set((state) => ({
              activeConversation: state.activeConversation
                ? {
                    ...state.activeConversation,
                    messages: [...state.activeConversation.messages, assistantMessage],
                  }
                : null,
              isSendingMessage: false,
            }));
          } else {
            set({ isSendingMessage: false });
          }
        } catch (err) {
          set({
            error: (err as { message: string }).message,
            isSendingMessage: false,
          });
        }
      },

      addOptimisticMessage: (message: Message) => {
        set((state) => ({
          activeConversation: state.activeConversation
            ? {
                ...state.activeConversation,
                messages: [...state.activeConversation.messages, message],
              }
            : null,
        }));
      },

      setActiveConversation: (conversation: Conversation | null) => {
        set({ activeConversation: conversation });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'ChatStore' }
  )
);
