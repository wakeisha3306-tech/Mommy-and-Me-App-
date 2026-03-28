import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  getDefaultNotificationPreferences,
  type AppNotification,
  type NotificationPreferences,
  type NotificationRead,
} from "@/lib/notifications";
import { getUserLabel } from "@/lib/utils";

type ConnectionRow = {
  id: string;
  partner_id: string;
  created_at: string;
};

type NoteRow = {
  id: string;
  user_id: string;
  author: "Mom" | "Daughter";
  text: string;
  visibility: "between_us" | "family";
  created_at: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  sender_role: "Mom" | "Daughter";
  text: string;
  created_at: string;
};

type MoodAlertRow = {
  id: string;
  sender_id: string;
  sender_role: "Mom" | "Daughter";
  created_at: string;
  viewed_at: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  email: string;
};

const PREF_SELECT =
  "user_id, connection_updates, shared_notes, direct_messages, family_messages, mood_alerts, created_at, updated_at";
const READ_SELECT = "id, user_id, source_type, source_id, read_at, created_at";

function preview(text: string, max = 92) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}...`;
}

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setNotifications([]);
      setPreferences(null);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const userId = session.user.id;

    try {
      const [
        prefResult,
        readResult,
        connectionResult,
        betweenUsResult,
        familyResult,
        messageResult,
        moodResult,
      ] = await Promise.all([
        supabase.from("notification_preferences").select(PREF_SELECT).eq("user_id", userId).maybeSingle<NotificationPreferences>(),
        supabase.from("notification_reads").select(READ_SELECT).eq("user_id", userId),
        supabase.from("connections").select("id, partner_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("id, user_id, author, text, visibility, created_at")
          .eq("visibility", "between_us")
          .neq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("id, user_id, author, text, visibility, created_at")
          .eq("visibility", "family")
          .neq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("direct_messages")
          .select("id, sender_id, sender_role, text, created_at")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("mood_support_alerts")
          .select("id, sender_id, sender_role, created_at, viewed_at")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const nextError =
        prefResult.error ??
        readResult.error ??
        connectionResult.error ??
        betweenUsResult.error ??
        familyResult.error ??
        messageResult.error ??
        moodResult.error;

      if (nextError) {
        console.error("[notifications] load failed", {
          userId,
          message: nextError.message,
        });
        setNotifications([]);
        setPreferences(getDefaultNotificationPreferences(userId));
        setError(nextError.message);
        setIsLoaded(true);
        return;
      }

      const reads = (readResult.data ?? []) as NotificationRead[];
      const readLookup = new Map(reads.map((item) => [`${item.source_type}:${item.source_id}`, item]));
      const connections = (connectionResult.data ?? []) as ConnectionRow[];
      const betweenUsNotes = (betweenUsResult.data ?? []) as NoteRow[];
      const familyNotes = (familyResult.data ?? []) as NoteRow[];
      const directMessages = (messageResult.data ?? []) as MessageRow[];
      const moodAlerts = (moodResult.data ?? []) as MoodAlertRow[];

      const partnerIds = [
        ...new Set([
          ...connections.map((item) => item.partner_id),
          ...betweenUsNotes.map((item) => item.user_id),
          ...familyNotes.map((item) => item.user_id),
          ...directMessages.map((item) => item.sender_id),
          ...moodAlerts.map((item) => item.sender_id),
        ]),
      ];

      let profileLookup = new Map<string, ProfileRow>();
      if (partnerIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", partnerIds);

        if (profileError) {
          console.error("[notifications] partner profile lookup failed", {
            userId,
            message: profileError.message,
          });
        } else {
          profileLookup = new Map((profileRows ?? []).map((item) => [item.id, item as ProfileRow]));
        }
      }

      const derivedNotifications: AppNotification[] = [
        ...connections.map((connection) => {
          const partner = profileLookup.get(connection.partner_id);
          const read = readLookup.get(`connection_joined:${connection.partner_id}`);
          return {
            id: `connection_joined:${connection.partner_id}`,
            source_id: connection.partner_id,
            type: "connection_joined" as const,
            title: `You're connected with ${getUserLabel(partner?.display_name, partner?.email)}`,
            body: "Your Between Us space is ready now. Tap to open your connection details.",
            href: "/connect",
            read_at: read?.read_at ?? null,
            created_at: connection.created_at,
          };
        }),
        ...betweenUsNotes.map((note) => {
          const read = readLookup.get(`shared_note:${note.id}`);
          return {
            id: `shared_note:${note.id}`,
            source_id: note.id,
            type: "shared_note" as const,
            title: `${note.author} sent you something 💛`,
            body: preview(note.text),
            href: `/notes?tab=between_us&partner=${encodeURIComponent(note.user_id)}`,
            read_at: read?.read_at ?? null,
            created_at: note.created_at,
          };
        }),
        ...familyNotes.map((note) => {
          const sender = profileLookup.get(note.user_id);
          const read = readLookup.get(`family_note:${note.id}`);
          return {
            id: `family_note:${note.id}`,
            source_id: note.id,
            type: "family_note" as const,
            title: "A family moment was shared",
            body: preview(note.text),
            href: "/notes?tab=family",
            read_at: read?.read_at ?? null,
            created_at: note.created_at,
          };
        }),
        ...directMessages.map((message) => {
          const read = readLookup.get(`direct_message:${message.id}`);
          return {
            id: `direct_message:${message.id}`,
            source_id: message.id,
            type: "direct_message" as const,
            title: `${message.sender_role} sent you a private message`,
            body: preview(message.text),
            href: `/notes?tab=direct&partner=${encodeURIComponent(message.sender_id)}`,
            read_at: read?.read_at ?? null,
            created_at: message.created_at,
          };
        }),
        ...moodAlerts.map((alert) => {
          const sender = profileLookup.get(alert.sender_id);
          const read = readLookup.get(`mood_alert:${alert.id}`);
          return {
            id: `mood_alert:${alert.id}`,
            source_id: alert.id,
            type: "mood_alert" as const,
            title: `${sender ? getUserLabel(sender.display_name, sender.email) : "Someone"} might need you today 💛`,
            body: `${getUserLabel(sender?.display_name, sender?.email)} shared how she's feeling today.`,
            href: `/notes?tab=direct&partner=${encodeURIComponent(alert.sender_id)}`,
            read_at: alert.viewed_at ?? read?.read_at ?? null,
            created_at: alert.created_at,
          };
        }),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const nextPreferences = prefResult.data ?? getDefaultNotificationPreferences(userId);
      const filteredNotifications = derivedNotifications.filter((item) => {
        if (item.type === "connection_joined") return nextPreferences.connection_updates;
        if (item.type === "shared_note") return nextPreferences.shared_notes;
        if (item.type === "direct_message") return nextPreferences.direct_messages;
        if (item.type === "family_note") return nextPreferences.family_messages;
        if (item.type === "mood_alert") return nextPreferences.mood_alerts;
        return true;
      });

      console.debug("[notifications] load success", {
        userId,
        connections: connections.length,
        betweenUs: betweenUsNotes.length,
        family: familyNotes.length,
        directMessages: directMessages.length,
        moodAlerts: moodAlerts.length,
        unread: filteredNotifications.filter((item) => !item.read_at).length,
      });

      setNotifications(filteredNotifications);
      setPreferences(nextPreferences);
      setIsLoaded(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "We couldn't load notifications right now.";
      console.error("[notifications] unexpected load error", {
        userId,
        message,
      });
      setNotifications([]);
      setPreferences(getDefaultNotificationPreferences(userId));
      setError(message);
      setIsLoaded(true);
    }
  }, [session?.user.id]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const notification = notifications.find((item) => item.id === id);
      if (!notification) return false;

      const now = new Date().toISOString();
      const { error: upsertError } = await supabase.from("notification_reads").upsert({
        user_id: session.user.id,
        source_type: notification.type,
        source_id: notification.source_id,
        read_at: now,
      });

      if (upsertError) {
        setError(upsertError.message);
        return false;
      }

      if (notification.type === "mood_alert") {
        await supabase
          .from("mood_support_alerts")
          .update({ viewed_at: now })
          .eq("id", notification.source_id)
          .eq("recipient_id", session.user.id);
      }

      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read_at: now } : item)));
      return true;
    },
    [notifications, session?.user.id],
  );

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !session?.user.id) return false;

    const unreadItems = notifications.filter((item) => !item.read_at);
    if (unreadItems.length === 0) return true;

    const now = new Date().toISOString();
    const payload = unreadItems.map((item) => ({
      user_id: session.user.id,
      source_type: item.type,
      source_id: item.source_id,
      read_at: now,
    }));

    const { error: upsertError } = await supabase.from("notification_reads").upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
      return false;
    }

    const moodIds = unreadItems.filter((item) => item.type === "mood_alert").map((item) => item.source_id);
    if (moodIds.length > 0) {
      await supabase.from("mood_support_alerts").update({ viewed_at: now }).in("id", moodIds).eq("recipient_id", session.user.id);
    }

    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
    return true;
  }, [notifications, session?.user.id]);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at">>) => {
      if (!supabase || !session?.user.id) return false;

      const nextPreferences = {
        ...(preferences ?? getDefaultNotificationPreferences(session.user.id)),
        ...updates,
        user_id: session.user.id,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError, data } = await supabase
        .from("notification_preferences")
        .upsert(nextPreferences)
        .select(PREF_SELECT)
        .single<NotificationPreferences>();

      if (upsertError) {
        setError(upsertError.message);
        return false;
      }

      setPreferences(data);
      return true;
    },
    [preferences, session?.user.id],
  );

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications]);

  return {
    notifications,
    preferences,
    unreadCount,
    isLoaded,
    error,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    reloadNotifications: loadNotifications,
  };
}
