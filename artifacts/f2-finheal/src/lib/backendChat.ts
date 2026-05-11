const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const DEFAULT_TIMEOUT_MS = 15000;

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const configuredApiKey = (import.meta.env.VITE_API_KEY || "").trim();

const normalizedApiBaseUrl = configuredBaseUrl.replace(/\/+$/, "");
const apiOrigin = (() => {
  try {
    return new URL(normalizedApiBaseUrl).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000";
  }
})();

export interface MoodDimensions {
  stress?: number;
  urgency?: number;
  openness?: number;
  willingness?: number;
  emotion?: number;
  [key: string]: number | undefined;
}

export interface BackendMood {
  primary_emotion?: string;
  label?: string;
  dimensions?: MoodDimensions;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
  mood?: BackendMood;
  suggestions?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messageCount?: number;
  moodColor?: string;
}

export interface BackendChatResponse {
  response: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  timestamp: string;
  mood?: BackendMood;
  suggestions?: string[];
}

export interface BackendConversationMessage {
  id?: string;
  message_id?: string;
  conversation_id?: string;
  user_id?: string;
  role?: "user" | "assistant" | "bot";
  content?: string;
  response?: string;
  timestamp?: string;
  created_at?: string;
  mood?: BackendMood;
  suggestions?: string[];
}

export interface BackendConversationSummary {
  id?: string;
  conversation_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  mood_color?: string;
}

export interface BackendRequestError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
  code?: string;
  details?: unknown;
  isTimeout?: boolean;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  expectJson?: boolean;
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function createHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);

  if (configuredApiKey) {
    nextHeaders.set("Authorization", `Bearer ${configuredApiKey}`);
  }

  return nextHeaders;
}

function createRequestError(message: string, init: Partial<BackendRequestError> = {}): BackendRequestError {
  const error = new Error(message) as BackendRequestError;
  error.name = "BackendRequestError";
  error.status = init.status;
  error.statusText = init.statusText;
  error.url = init.url;
  error.code = init.code;
  error.details = init.details;
  error.isTimeout = init.isTimeout;
  return error;
}

export function normalizeBackendError(error: unknown): BackendRequestError {
  if (error instanceof Error && error.name === "BackendRequestError") {
    return error as BackendRequestError;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return createRequestError("Request timed out. Please try again.", { code: "timeout", isTimeout: true });
  }

  if (error instanceof Error) {
    return createRequestError(error.message || "Unexpected backend error.");
  }

  return createRequestError("Unexpected backend error.");
}

async function parseResponseBody<T>(response: Response, expectJson: boolean): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();

  if (!rawBody) {
    return undefined as T;
  }

  if (!expectJson) {
    return rawBody as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return rawBody as T;
  }
}

async function request<T>(path: string, options: RequestOptions = {}, useOriginBase = false): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, expectJson = true, headers, ...init } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const url = useOriginBase ? buildUrl(apiOrigin, path) : buildUrl(normalizedApiBaseUrl, path);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: createHeaders(headers),
    });

    if (!response.ok) {
      const body = await parseResponseBody<unknown>(response, true).catch(() => undefined);
      throw createRequestError(response.statusText || "Backend request failed.", {
        status: response.status,
        statusText: response.statusText,
        url,
        details: body,
      });
    }

    return parseResponseBody<T>(response, expectJson);
  } catch (error) {
    throw normalizeBackendError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const arrayCandidate = record.items || record.results || record.conversations || record.messages || record.data;
  return Array.isArray(arrayCandidate) ? (arrayCandidate as T[]) : [];
}

export function extractMoodDimensions(mood: BackendMood | undefined): MoodDimensions | null {
  if (!mood) {
    return null;
  }

  if (mood.dimensions && Object.keys(mood.dimensions).length > 0) {
    return mood.dimensions;
  }

  const candidate = mood as Record<string, unknown>;
  const dimensions: MoodDimensions = {};

  for (const key of ["stress", "urgency", "openness", "willingness", "emotion", "stress_level", "financial_anxiety"]) {
    const value = candidate[key];
    if (typeof value === "number") {
      dimensions[key] = value;
    }
  }

  return Object.keys(dimensions).length > 0 ? dimensions : null;
}

function normalizeConversation(summary: BackendConversationSummary): ConversationSummary {
  const id = summary.id || summary.conversation_id || "";

  return {
    id,
    title: summary.title || "Untitled conversation",
    createdAt: summary.created_at || summary.updated_at || new Date().toISOString(),
    updatedAt: summary.updated_at,
    messageCount: summary.message_count,
    moodColor: summary.mood_color,
  };
}

function normalizeConversationMessage(message: BackendConversationMessage): ChatMessage {
  const rawTimestamp = message.timestamp || message.created_at || new Date().toISOString();
  return {
    id: message.id || message.message_id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: message.role === "user" ? "user" : "bot",
    content: message.content || message.response || "",
    time: new Date(rawTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    mood: message.mood,
    suggestions: message.suggestions,
  };
}

export async function getBackendHealth(): Promise<boolean> {
  await request<unknown>("health", { expectJson: false }, true);
  return true;
}

export async function sendChatMessage(payload: {
  message: string;
  user_id: string;
  conversation_id?: string;
}): Promise<BackendChatResponse> {
  return request<BackendChatResponse>("chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getConversations(userId: string, limit = 20, offset = 0): Promise<ConversationSummary[]> {
  const params = new URLSearchParams({ user_id: userId, limit: String(limit), offset: String(offset) });
  const response = await request<unknown>(`conversations?${params.toString()}`);
  return extractArray<BackendConversationSummary>(response).map(normalizeConversation);
}

export async function getConversation(conversationId: string, userId: string): Promise<ConversationSummary | null> {
  const params = new URLSearchParams({ user_id: userId });
  const response = await request<unknown>(`conversations/${conversationId}?${params.toString()}`);
  const conversations = extractArray<BackendConversationSummary>(response);
  if (conversations.length > 0) {
    return normalizeConversation(conversations[0]);
  }

  if (response && typeof response === "object") {
    const record = response as BackendConversationSummary;
    if (record.id || record.conversation_id) {
      return normalizeConversation(record);
    }
  }

  return null;
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit = 100,
  offset = 0,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ user_id: userId, limit: String(limit), offset: String(offset) });
  const response = await request<unknown>(`conversations/${conversationId}/messages?${params.toString()}`);
  return extractArray<BackendConversationMessage>(response).map(normalizeConversationMessage);
}

export function getApiBaseUrl(): string {
  return normalizedApiBaseUrl;
}
