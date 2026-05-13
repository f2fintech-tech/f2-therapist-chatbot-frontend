import {
  getMostRecentLocalConversationUserId,
  migrateConversationsFromEmptyUserId,
  migrateConversationsFromUserId,
} from "@/utils/localConversations";

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

const DEMO_FALLBACK_USER_ID = "5d2ab354-e9f1-42ad-97f9-2d9eec92611a";
const DEMO_DISPLAY_NAME = "Pioneer";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | null | undefined): value is string {
  return !!value && UUID_PATTERN.test(value);
}

function ensureUuidUserId(candidate: string | null | undefined): string {
  if (isValidUuid(candidate)) {
    return candidate;
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return DEMO_FALLBACK_USER_ID;
}

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
  const session = readStoredSession();
  if (!session || typeof window === "undefined") {
    return session;
  }

  const normalizedUserId = ensureUuidUserId(session.userId);
  if (normalizedUserId === session.userId) {
    return session;
  }

  migrateConversationsFromUserId(session.userId, normalizedUserId);
  migrateConversationsFromEmptyUserId(normalizedUserId);

  const normalizedSession: DemoAuthSession = {
    ...session,
    userId: normalizedUserId,
  };
  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(normalizedSession));
  window.localStorage.setItem(DEMO_USER_ID_STORAGE_KEY, normalizedUserId);

  return normalizedSession;
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
      userId: ensureUuidUserId(DEMO_FALLBACK_USER_ID),
      displayName: DEMO_DISPLAY_NAME,
      authenticatedAt: new Date().toISOString(),
    };
  }

  const recoveredUserId = getMostRecentLocalConversationUserId();
  const storedUserId = window.localStorage.getItem(DEMO_USER_ID_STORAGE_KEY);
  const legacyUserId = recoveredUserId || storedUserId || DEMO_FALLBACK_USER_ID;
  const normalizedUserId = ensureUuidUserId(legacyUserId);

  if (legacyUserId !== normalizedUserId) {
    migrateConversationsFromUserId(legacyUserId, normalizedUserId);
  }

  const session: DemoAuthSession = {
    username: DEMO_CREDENTIALS.username,
    userId: normalizedUserId,
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
