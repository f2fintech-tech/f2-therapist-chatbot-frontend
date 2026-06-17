import { getStoredAuthToken } from "@/utils/authSession";

const DEFAULT_API_BASE_URL = "/api/v1";
const DEFAULT_TIMEOUT_MS = 120000;

function resolveCodespacesBackendFromCurrentHost(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { protocol, hostname } = window.location;
  if (protocol !== "https:" || !hostname.endsWith(".app.github.dev")) {
    return null;
  }

  // In Codespaces, use a same-origin API path so the frontend dev server can proxy to the backend.
  return DEFAULT_API_BASE_URL;
}

function resolveDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

function resolveConfiguredApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!envValue) {
    return resolveDefaultApiBaseUrl();
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isCodespacesFrontend = protocol === "https:" && hostname.endsWith(".app.github.dev");
    const isLocalFrontend = hostname === "localhost" || hostname === "127.0.0.1";
    const isLocalHttpTarget = envValue.startsWith("http://localhost") || envValue.startsWith("http://127.0.0.1");
    const isCodespacesTarget = envValue.includes(".app.github.dev");
    const isRelativeTarget = envValue.startsWith("/");

    // Codespaces frontend should use the proxied API path so the browser never hits localhost directly.
    if (isCodespacesFrontend && (isLocalHttpTarget || isCodespacesTarget || isRelativeTarget)) {
      return DEFAULT_API_BASE_URL;
    }

    // Local frontend should avoid a Codespaces tunnel URL if one was configured.
    if (isLocalFrontend && isCodespacesTarget) {
      return DEFAULT_API_BASE_URL;
    }
  }

  return envValue;
}

const configuredBaseUrl = resolveConfiguredApiBaseUrl();
const configuredApiKey = (import.meta.env.VITE_API_KEY || "").trim();

const normalizedApiBaseUrl = configuredBaseUrl.replace(/\/+$/, "");
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
  timestamp?: string;
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
  title?: string;
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

export interface WellnessTestResultInput {
  user_id: string;
  test_type: string;
  raw_score: number;
  normalized_score?: number;
  completed_at?: string;
  insights?: string[];
  category_breakdown?: Record<string, unknown>;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  expectJson?: boolean;
  signal?: AbortSignal;
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function createHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  const storedToken = getStoredAuthToken();

  if (storedToken) {
    nextHeaders.set("Authorization", `Bearer ${storedToken}`);
  } else if (configuredApiKey) {
    nextHeaders.set("Authorization", `Bearer ${configuredApiKey}`);
  }

  return nextHeaders;
}

function createRequestError(message: string, init: Partial<BackendRequestError> = {}): BackendRequestError {
  let finalMessage = message;
  if (init.details && typeof init.details === "object" && "detail" in (init.details as any)) {
    const detail = (init.details as any).detail;
    if (typeof detail === "string") {
      finalMessage = detail;
    } else if (Array.isArray(detail)) {
      finalMessage = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ");
    }
  }
  const error = new Error(finalMessage) as BackendRequestError;
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, expectJson = true, headers, signal, ...init } = options;
  const controller = new AbortController();
  let abortedByTimeout = false;
  let abortedByExternalSignal = false;
  let timeoutId: number | undefined;
  const url = buildUrl(normalizedApiBaseUrl, path);

  const handleExternalAbort = () => {
    abortedByExternalSignal = true;
    controller.abort();
  };

  if (signal) {
    if (signal.aborted) {
      abortedByExternalSignal = true;
      controller.abort();
    } else {
      signal.addEventListener("abort", handleExternalAbort, { once: true });
    }
  }

  try {
    timeoutId = window.setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, timeoutMs);

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
    if (error instanceof DOMException && error.name === "AbortError") {
      if (abortedByExternalSignal || signal?.aborted) {
        throw createRequestError("Request cancelled.", { code: "cancelled" });
      }

      if (abortedByTimeout) {
        throw createRequestError("Request timed out. Please try again.", { code: "timeout", isTimeout: true });
      }
    }

    throw normalizeBackendError(error);
  } finally {
    if (signal) {
      signal.removeEventListener("abort", handleExternalAbort);
    }
    if (typeof timeoutId === "number") {
      window.clearTimeout(timeoutId);
    }
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

function getDisplayTimeZone(): string {
  return "Asia/Kolkata";
}

function getCalendarDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getDisplayTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatMessageTimestamp(rawTimestamp: string | undefined): string {
  if (!rawTimestamp) {
    return "";
  }

  let parsedTimestamp = rawTimestamp;
  if (
    rawTimestamp.includes("T") &&
    !rawTimestamp.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(rawTimestamp)
  ) {
    parsedTimestamp = rawTimestamp + "Z";
  }

  const timestamp = new Date(parsedTimestamp);
  if (Number.isNaN(timestamp.getTime())) {
    return rawTimestamp;
  }

  const now = new Date();
  const displayTimeZone = getDisplayTimeZone();
  const timeText = timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: displayTimeZone,
  });

  if (getCalendarDateKey(timestamp) === getCalendarDateKey(now)) {
    return timeText;
  }

  const dateText = timestamp.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: displayTimeZone,
  });

  return `${dateText}, ${timeText}`;
}

export function formatConversationDateLabel(rawTimestamp: string | undefined): string {
  if (!rawTimestamp) {
    return "";
  }

  let parsedTimestamp = rawTimestamp;
  if (
    rawTimestamp.includes("T") &&
    !rawTimestamp.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(rawTimestamp)
  ) {
    parsedTimestamp = rawTimestamp + "Z";
  }

  const timestamp = new Date(parsedTimestamp);
  if (Number.isNaN(timestamp.getTime())) {
    return rawTimestamp;
  }

  return timestamp.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: getDisplayTimeZone(),
  });
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
    timestamp: rawTimestamp,
    time: formatMessageTimestamp(rawTimestamp),
    mood: message.mood,
    suggestions: message.suggestions,
  };
}

export async function getBackendHealth(): Promise<boolean> {
  await request<unknown>("health", { expectJson: false });
  return true;
}

export async function sendChatMessage(
  payload: {
    message: string;
    user_id: string;
    conversation_id?: string;
  },
  onChunk: (chunk: any) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = buildUrl(normalizedApiBaseUrl, "chat/");
  
  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    signal,
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

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("ReadableStream not supported by browser/response.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          onChunk(parsed);
        } catch (err) {
          console.error("Error parsing stream line:", err, trimmed);
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        onChunk(parsed);
      } catch (err) {
        console.error("Error parsing final stream buffer:", err, buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
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

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  const params = new URLSearchParams({ user_id: userId });
  await request<void>(`conversations/${conversationId}?${params.toString()}`, { method: "DELETE", expectJson: false });
}

export async function submitWellnessTestResult(payload: WellnessTestResultInput): Promise<void> {
  await request<void>("wellness/test-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    expectJson: false,
  });
}

export function getApiBaseUrl(): string {
  return normalizedApiBaseUrl;
}
