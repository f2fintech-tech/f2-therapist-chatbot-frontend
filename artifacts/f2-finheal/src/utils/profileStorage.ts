export interface StoredUserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation: string;
  bio: string;
}

const PROFILE_STORAGE_PREFIX = "finheal-user-profile";

function storageKey(userId: string): string {
  return `${PROFILE_STORAGE_PREFIX}:${userId}`;
}

function createDefaultProfile(displayName: string, email?: string): StoredUserProfile {
  return {
    fullName: displayName,
    email: email || "",
    phone: "",
    location: "",
    occupation: "",
    bio: "",
  };
}

function normalizeProfile(profile: Partial<StoredUserProfile>, fallbackName: string, fallbackEmail?: string): StoredUserProfile {
  return {
    fullName: (profile.fullName || fallbackName || "").trim(),
    email: (profile.email || fallbackEmail || "").trim(),
    phone: (profile.phone || "").trim(),
    location: (profile.location || "").trim(),
    occupation: (profile.occupation || "").trim(),
    bio: (profile.bio || "").trim(),
  };
}

export function loadStoredUserProfile(
  userId: string,
  displayName: string,
  email?: string
): StoredUserProfile {
  if (typeof window === "undefined") {
    return createDefaultProfile(displayName, email);
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return createDefaultProfile(displayName, email);
    }

    const parsed = JSON.parse(raw) as Partial<StoredUserProfile>;
    return normalizeProfile(parsed, displayName, email);
  } catch {
    return createDefaultProfile(displayName, email);
  }
}

export function saveStoredUserProfile(userId: string, profile: StoredUserProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    // ignore storage failures
  }
}
