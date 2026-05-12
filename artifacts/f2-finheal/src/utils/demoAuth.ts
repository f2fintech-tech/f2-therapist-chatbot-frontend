import { getMostRecentLocalConversationUserId, migrateConversationsFromEmptyUserId } from "@/utils/localConversations";

export interface DemoAuthSession {
  username: string;
  userId: string;
  displayName: string;
  authenticatedAt: string;
}

export interface DemoCredentials {
  username: string;
  password: string;
}

const DEMO_AUTH_STORAGE_KEY = "finheal-demo-auth";
const DEMO_USER_ID_STORAGE_KEY = "finheal-user-id";

const DEMO_CREDENTIALS: DemoCredentials = {
  username: import.meta.env.VITE_DEMO_USERNAME?.trim() || "demo@finheal.app",
  password: import.meta.env.VITE_DEMO_PASSWORD?.trim() || "FinHeal@123",
};

const DEMO_FALLBACK_USER_ID = "f2-finheal-demo-user";
const DEMO_DISPLAY_NAME = "Pioneer";

function readStoredSession(): DemoAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DemoAuthSession;
    if (!parsed?.username || !parsed?.userId || !parsed?.displayName) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getStoredDemoSession(): DemoAuthSession | null {
  return readStoredSession();
}

export function getDemoLoginCredentials(): DemoCredentials {
  return DEMO_CREDENTIALS;
}

export function signInDemoAccount(username: string, password: string): DemoAuthSession | null {
  if (username.trim() !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
    return null;
  }

  if (typeof window === "undefined") {
    return {
      username: DEMO_CREDENTIALS.username,
      userId: DEMO_FALLBACK_USER_ID,
      displayName: DEMO_DISPLAY_NAME,
      authenticatedAt: new Date().toISOString(),
    };
  }

  const recoveredUserId = getMostRecentLocalConversationUserId();
  const session: DemoAuthSession = {
    username: DEMO_CREDENTIALS.username,
    userId: recoveredUserId || window.localStorage.getItem(DEMO_USER_ID_STORAGE_KEY) || DEMO_FALLBACK_USER_ID,
    displayName: DEMO_DISPLAY_NAME,
    authenticatedAt: new Date().toISOString(),
  };

  // Migrate any conversations stored under empty userId to this user's ID
  migrateConversationsFromEmptyUserId(session.userId);

  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(DEMO_USER_ID_STORAGE_KEY, session.userId);
  return session;
}

export function signOutDemoAccount(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}
