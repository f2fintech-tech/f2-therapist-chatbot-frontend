import apiClient from './api';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import {
  Conversation,
  ConversationSummary,
  Message,
  SendMessagePayload,
  SendMessageResponse,
} from '../types/chat';

export const chatService = {
  /**
   * Get all conversations for the current user
   */
  getConversations: async (
    params?: PaginationParams
  ): Promise<PaginatedResponse<ConversationSummary>> => {
    const { data } = await apiClient.get<PaginatedResponse<ConversationSummary>>(
      '/conversations',
      { params }
    );
    return data;
  },

  /**
   * Get a single conversation with messages
   */
  getConversation: async (conversationId: string): Promise<ApiResponse<Conversation>> => {
    const { data } = await apiClient.get<ApiResponse<Conversation>>(
      `/conversations/${conversationId}`
    );
    return data;
  },

  /**
   * Create a new conversation
   */
  createConversation: async (title?: string): Promise<ApiResponse<Conversation>> => {
    const { data } = await apiClient.post<ApiResponse<Conversation>>('/conversations', {
      title: title || 'New Conversation',
    });
    return data;
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/conversations/${conversationId}`
    );
    return data;
  },

  /**
   * Send a message and receive AI response
   */
  sendMessage: async (payload: SendMessagePayload): Promise<ApiResponse<SendMessageResponse>> => {
    const { data } = await apiClient.post<ApiResponse<SendMessageResponse>>('/chat/message', payload);
    return data;
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (
    conversationId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Message>> => {
    const { data } = await apiClient.get<PaginatedResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      { params }
    );
    return data;
  },

  /**
   * Update conversation title
   */
  updateConversationTitle: async (
    conversationId: string,
    title: string
  ): Promise<ApiResponse<Conversation>> => {
    const { data } = await apiClient.patch<ApiResponse<Conversation>>(
      `/conversations/${conversationId}`,
      { title }
    );
    return data;
  },
};
