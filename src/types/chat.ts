export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  isActive: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
}

export interface SendMessagePayload {
  conversationId?: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
  conversationId: string;
  assistantMessage: Message;
}
