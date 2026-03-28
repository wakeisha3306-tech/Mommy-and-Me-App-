export type AppNotificationType =
  | "connection_joined"
  | "shared_note"
  | "direct_message"
  | "family_note"
  | "mood_alert";

export interface AppNotification {
  id: string;
  source_id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  connection_updates: boolean;
  shared_notes: boolean;
  direct_messages: boolean;
  family_messages: boolean;
  mood_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRead {
  id: string;
  user_id: string;
  source_type: AppNotificationType;
  source_id: string;
  read_at: string;
  created_at: string;
}

export const GENTLE_ALERTS_STORAGE_KEY = "between-us-gentle-alerts";

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at"> = {
  connection_updates: true,
  shared_notes: true,
  direct_messages: true,
  family_messages: true,
  mood_alerts: true,
};

export function getDefaultNotificationPreferences(userId: string): NotificationPreferences {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    created_at: now,
    updated_at: now,
    ...DEFAULT_PREFERENCES,
  };
}

export function getGentleAlertsEnabled() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(GENTLE_ALERTS_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setGentleAlertsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GENTLE_ALERTS_STORAGE_KEY, String(enabled));
}
