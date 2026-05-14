import { getApiBaseUrl } from "@/lib/backendChat";
import type { AuthSession } from "@/utils/authSession";

interface AuthResponse {
  user_id: string;
  token?: string;
  email?: string;
  name?: string;
  hearts?: number;
  is_guest?: boolean;
}

const configuredApiKey = import.meta.env.VITE_API_KEY?.trim();

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) {
    throw new Error("Unexpected empty response from auth service");
  }
  return JSON.parse(raw) as T;
}

async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(configuredApiKey ? { Authorization: `Bearer ${configuredApiKey}`, "X-API-Key": configuredApiKey } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const message = body || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return parseJsonResponse<T>(response);
}

export async function signInGuest(existingUserId?: string): Promise<AuthSession> {
  const userId = existingUserId || createUuid();
  const result = await authRequest<AuthResponse>("auth/guest", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

  return {
    userId: result.user_id,
    token: "",
    displayName: "Guest",
    hearts: result.hearts ?? 50,
    isGuest: true,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function signInUser(email: string, password: string): Promise<AuthSession> {
  const result = await authRequest<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || email,
    hearts: result.hearts ?? null,
    isGuest: false,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function signUpUser(email: string, password: string, guestUserId?: string): Promise<AuthSession> {
  const result = await authRequest<AuthResponse>("auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name: email, guest_user_id: guestUserId }),
  });

  return {
    userId: result.user_id,
    token: result.token ?? "",
    email: result.email,
    displayName: result.name || email,
    hearts: result.hearts ?? null,
    isGuest: false,
    authenticatedAt: new Date().toISOString(),
  };
}

export async function fetchHearts(userId: string): Promise<number> {
  const response = await authRequest<{ hearts: number }>(`auth/hearts/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
  return response.hearts;
}
