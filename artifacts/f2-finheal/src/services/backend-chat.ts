export interface BackendMoodDimensions {
  stress?: number;
  urgency?: number;
  openness?: number;
  willingness?: number;
  emotion?: number;
}

export interface BackendMoodAnalysis {
  primary_emotion?: string;
  label?: string;
  dimensions?: BackendMoodDimensions;
}

export interface BackendChatResponse {
  response: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  timestamp: string;
  mood?: BackendMoodAnalysis;
  experiment?: unknown;
  evaluation?: unknown;
  conversation_state?: unknown;
}

export interface BackendHealthResponse {
  status: string;
  version: string;
  service: string;
  database_configured: boolean;
  gemini_api_configured: boolean;
  pinecone_configured: boolean;
  aws_configured: boolean;
}

export interface BackendApiError {
  status: number;
  message: string;
  details?: unknown;
  endpoint: string;
}

export interface SendBackendMessageInput {
  message: string;
  user_id: string;
  conversation_id?: string;
}

const REQUEST_TIMEOUT_MS = 15000;

function getApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!envBaseUrl) {
    console.warn(
      "VITE_API_BASE_URL is not set in environment variables. " +
      "Please create a .env file with VITE_API_BASE_URL=http://localhost:8000/api/v1 or your backend URL."
    );
    throw new Error(
      "Backend API URL is not configured. Set VITE_API_BASE_URL in .env file."
    );
  }
  return envBaseUrl;
}

function getRootBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
}

function getApiKey(): string {
  const envKey = import.meta.env.VITE_API_KEY?.trim();
  if (!envKey) {
    console.warn(
      "VITE_API_KEY is not set in environment variables. " +
      "API requests may fail with 401 authorization errors. " +
      "Set VITE_API_KEY in .env file (e.g., VITE_API_KEY=dev-key)."
    );
  }
  return envKey || "";
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

async function parseErrorResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function buildErrorMessage(response: Response, details: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof details === "string") {
    const trimmed = details.trim();
    return trimmed ? `${prefix}: ${trimmed}` : prefix;
  }

  if (typeof details === "object" && details !== null) {
    const maybeDetail = (details as { detail?: unknown }).detail;
    if (typeof maybeDetail === "string" && maybeDetail.trim()) {
      return `${prefix}: ${maybeDetail.trim()}`;
    }
    const maybeMessage = (details as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return `${prefix}: ${maybeMessage.trim()}`;
    }
  }

  return prefix;
}

async function request<T>(baseUrl: string, endpoint: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...init,
      headers: {
        ...buildHeaders(),
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await parseErrorResponse(response);
      const error: BackendApiError = {
        status: response.status,
        message: buildErrorMessage(response, details),
        details,
        endpoint,
      };
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw {
        status: 0,
        message: "Request timed out",
        endpoint,
      } satisfies BackendApiError;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "message" in error &&
      "endpoint" in error
    ) {
      throw error as BackendApiError;
    }

    throw {
      status: 0,
      message: error instanceof Error ? error.message : "Network error",
      endpoint,
    } satisfies BackendApiError;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getBackendHealth(): Promise<BackendHealthResponse> {
  return request<BackendHealthResponse>(getRootBaseUrl(), "/health", { method: "GET" });
}

export async function sendBackendMessage(
  input: SendBackendMessageInput,
): Promise<BackendChatResponse> {
  return request<BackendChatResponse>(getApiBaseUrl(), "/chat/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
