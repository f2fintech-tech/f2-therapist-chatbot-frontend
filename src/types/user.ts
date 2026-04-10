export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  chatSettings: ChatSettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sessionReminders: boolean;
}

export interface ChatSettings {
  showTimestamps: boolean;
  messageSound: boolean;
  autoSuggestResponses: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesPayload {
  preferences: Partial<UserPreferences>;
}
