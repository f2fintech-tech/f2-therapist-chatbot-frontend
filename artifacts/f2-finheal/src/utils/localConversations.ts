import type { ChatMessage, ConversationSummary } from "@/lib/backendChat";

const STORAGE_KEY = "finheal_local_conversations";

type StoredConversation = {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

function _readStore(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredConversation[];
  } catch {
    return [];
  }
}

function _writeStore(items: StoredConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function listLocalConversations(userId: string): ConversationSummary[] {
  const items = _readStore().filter((c) => c.user_id === userId);
  return items
    .map((c) => ({
      id: c.id,
      title: c.title || "Untitled conversation",
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      messageCount: c.messages.length,
      moodColor: undefined,
    }))
    .sort((a, b) => (b.updatedAt || "")!.localeCompare(a.updatedAt || ""));
}

export function getLocalConversationMessages(conversationId: string, userId: string): ChatMessage[] {
  const items = _readStore();
  const conv = items.find((c) => c.id === conversationId && c.user_id === userId);
  return conv ? conv.messages : [];
}

export function upsertLocalConversation(conversationId: string, userId: string, messages: ChatMessage[], title?: string) {
  const items = _readStore();
  const now = new Date().toISOString();
  const idx = items.findIndex((c) => c.id === conversationId && c.user_id === userId);
  if (idx >= 0) {
    items[idx].messages = messages;
    items[idx].updated_at = now;
    items[idx].title = title || items[idx].title;
  } else {
    items.push({ id: conversationId, user_id: userId, title: title || "Untitled conversation", created_at: now, updated_at: now, messages });
  }
  _writeStore(items);
}

export function deleteLocalConversation(conversationId: string, userId: string) {
  let items = _readStore();
  items = items.filter((c) => !(c.id === conversationId && c.user_id === userId));
  _writeStore(items);
}

export function exportLocalConversation(conversationId: string, userId: string): string | null {
  const items = _readStore();
  const conv = items.find((c) => c.id === conversationId && c.user_id === userId);
  if (!conv) return null;
  return JSON.stringify(conv, null, 2);
}
