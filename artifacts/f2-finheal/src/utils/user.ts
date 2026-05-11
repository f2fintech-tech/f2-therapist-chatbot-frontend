/**
 * User profile and display name utilities.
 * Generates user-friendly display names and initials from user IDs or profile data.
 */

export interface UserProfile {
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  initials: string;
  userTier?: string;
  email?: string;
}

const DISPLAY_NAME_STORAGE_KEY = "finheal-user-display-name";
const DEFAULT_DISPLAY_NAMES = [
  "Explorer",
  "Participant",
  "Learner",
  "Friend",
  "Seeker",
  "Companion",
  "Adventurer",
  "Collaborator",
  "Innovator",
  "Pioneer",
];

function getAnonymousDisplayNamePool(): string[] {
  const configuredNames = import.meta.env.VITE_USER_DISPLAY_NAMES?.trim();

  if (!configuredNames) {
    return DEFAULT_DISPLAY_NAMES;
  }

  const parsedNames = configuredNames
    .split(/[\n,|]+/)
    .map((name: string) => name.trim())
    .filter(Boolean);

  return parsedNames.length > 0 ? parsedNames : DEFAULT_DISPLAY_NAMES;
}

function pickRandomDisplayName(names: string[]): string {
  if (names.length === 0) {
    return "Client";
  }

  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex] || "Client";
}

/**
 * Generate user initials from a full name.
 * @example
 * getInitials("Aditya Rawal") // => "AR"
 * getInitials("John") // => "J"
 * getInitials("") // => "??"
 */
export function getInitials(displayName: string): string {
  if (!displayName || !displayName.trim()) {
    return "??";
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    // Single name: use first letter
    return parts[0].substring(0, 1).toUpperCase();
  }

  // Multiple names: use first letter of first and last name
  const initials = [parts[0][0], parts[parts.length - 1][0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || "??";
}

/**
 * Parse a full name into first and last name.
 */
export function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || !fullName.trim()) {
    return { firstName: "User", lastName: "" };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * Generate a user-friendly display name from a UUID or custom user ID.
 * If a display name override is set (via env or sessionStorage), use that.
 * Otherwise, generate a neutral therapy-friendly placeholder name.
 *
 * @example
 * generateUserDisplayName("123e4567-e89b-12d3-a456-426614174000")
 * // => "Client" (default friendly name if no override)
 * generateUserDisplayName("123e4567-e89b-12d3-a456-426614174000", "Aditya Rawal")
 * // => "Aditya Rawal"
 */
export function generateUserDisplayName(
  userId: string,
  overrideName?: string
): string {
  if (overrideName && overrideName.trim()) {
    return overrideName.trim();
  }

  if (typeof window !== "undefined") {
    const storedName = window.sessionStorage.getItem(DISPLAY_NAME_STORAGE_KEY);
    if (storedName) {
      return storedName;
    }

    const selectedName = pickRandomDisplayName(getAnonymousDisplayNamePool());
    window.sessionStorage.setItem(DISPLAY_NAME_STORAGE_KEY, selectedName);
    return selectedName;
  }

  return pickRandomDisplayName(getAnonymousDisplayNamePool());
}

/**
 * Create a user profile object from a user ID and optional display name.
 */
export function createUserProfile(
  userId: string,
  displayNameOverride?: string
): UserProfile {
  const displayName = generateUserDisplayName(userId, displayNameOverride);
  const { firstName, lastName } = parseName(displayName);
  const initials = getInitials(displayName);

  return {
    userId,
    displayName,
    firstName,
    lastName,
    initials,
    userTier: "Standard", // Default tier; can be overridden per user
  };
}

/**
 * Store user display name in sessionStorage for the current session.
 * This allows the user to set their name once and have it persist across component reloads.
 */
export function setUserDisplayName(displayName: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName.trim());
  }
}

/**
 * Get the stored user display name from sessionStorage.
 */
export function getUserDisplayName(): string | null {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem(DISPLAY_NAME_STORAGE_KEY);
  }
  return null;
}

/**
 * Clear the stored user display name.
 */
export function clearUserDisplayName(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(DISPLAY_NAME_STORAGE_KEY);
  }
}

/**
 * Get or create a user profile for the current session.
 */
export function getOrCreateUserProfile(
  userId: string,
  displayNameOverride?: string
): UserProfile {
  return createUserProfile(userId, displayNameOverride);
}
