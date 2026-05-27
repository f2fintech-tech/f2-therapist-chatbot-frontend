export interface AuthSession {
  userId: string;
  token: string | null;
  email?: string;
  displayName: string;
  avatarUrl?: string | null;
  hearts?: number | null;
  isGuest?: boolean | null;
  authenticatedAt: string;
}

const AUTH_SESSION_STORAGE_KEY = "finheal-auth-session";

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.userId || !parsed?.displayName) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage failures
  }
}

export function clearStoredAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function getStoredAuthToken(): string | null {
  const session = getStoredAuthSession();
  return session?.token || null;
}
