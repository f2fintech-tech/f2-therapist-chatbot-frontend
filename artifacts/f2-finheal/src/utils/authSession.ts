export interface AuthSession {
  userId: string;
  token: string | null;
  email?: string;
  displayName: string;
  avatarUrl?: string | null;
  hearts?: number | null;
  isGuest?: boolean | null;
  isAdvisor?: boolean | null;
  isStaff?: boolean | null;
  permissions?: string[];
  authenticatedAt: string;
  lastActiveAt?: string;
}

const AUTH_SESSION_STORAGE_KEY = "finheal-auth-session";
const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 hours

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

    // Check 6-hour inactivity timeout across browser reloads, tab closes, & overnight sleep
    const lastActive = parsed.lastActiveAt || parsed.authenticatedAt;
    if (lastActive) {
      const lastActiveTime = new Date(lastActive).getTime();
      if (!isNaN(lastActiveTime)) {
        const now = Date.now();
        if (now - lastActiveTime > SESSION_TIMEOUT_MS) {
          // Session expired due to 6+ hours of inactivity
          clearStoredAuthSession();
          return null;
        }
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

let lastTouchTimestamp = 0;

export function touchAuthSession(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  // Throttle updates to localStorage to once every 30 seconds
  if (now - lastTouchTimestamp < 30000) return;
  lastTouchTimestamp = now;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.userId) {
      parsed.lastActiveAt = new Date(now).toISOString();
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

export function setStoredAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const sessionWithActivity: AuthSession = {
      ...session,
      lastActiveAt: session.lastActiveAt || new Date().toISOString(),
    };
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(sessionWithActivity));
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
