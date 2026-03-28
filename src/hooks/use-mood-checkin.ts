import { useCallback, useEffect, useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type MoodValue = "good" | "okay" | "not_great" | "need_to_talk";

export interface MoodCheckin {
  id: string;
  user_id: string;
  mood: MoodValue;
  shared: boolean;
  created_at: string;
}

export interface MoodSupportAlert {
  id: string;
  checkin_id: string;
  sender_id: string;
  recipient_id: string;
  sender_role: "Mom" | "Daughter";
  created_at: string;
  viewed_at: string | null;
}

const CHECKIN_SELECT = "id, user_id, mood, shared, created_at";
const ALERT_SELECT = "id, checkin_id, sender_id, recipient_id, sender_role, created_at, viewed_at";

export function getMoodLabel(mood: MoodValue) {
  switch (mood) {
    case "good":
      return "Good";
    case "okay":
      return "Okay";
    case "not_great":
      return "Not great";
    case "need_to_talk":
      return "Need to talk";
  }
}

export function useMoodCheckin() {
  const { session, profile } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<MoodCheckin | null>(null);
  const [alerts, setAlerts] = useState<MoodSupportAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoodState = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setTodayCheckin(null);
      setAlerts([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const dayStart = startOfDay(new Date()).toISOString();
    const dayEnd = endOfDay(new Date()).toISOString();

    const [{ data: checkinData, error: checkinError }, { data: alertData, error: alertError }] = await Promise.all([
      supabase
        .from("mood_checkins")
        .select(CHECKIN_SELECT)
        .eq("user_id", session.user.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<MoodCheckin>(),
      supabase
        .from("mood_support_alerts")
        .select(ALERT_SELECT)
        .eq("recipient_id", session.user.id)
        .is("viewed_at", null)
        .order("created_at", { ascending: false }),
    ]);

    const nextError = checkinError ?? alertError;
    if (nextError) {
      setTodayCheckin(null);
      setAlerts([]);
      setError(nextError.message);
      setIsLoaded(true);
      return;
    }

    setTodayCheckin(checkinData ?? null);
    setAlerts((alertData ?? []) as MoodSupportAlert[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadMoodState();
  }, [loadMoodState]);

  const saveCheckin = useCallback(
    async (mood: MoodValue, shared: boolean, recipientId?: string | null) => {
      if (!supabase || !session?.user.id || !profile?.role) {
        return { error: "You need to be signed in to save your check-in." };
      }

      setIsSaving(true);
      setError(null);

      let checkinId = todayCheckin?.id ?? null;

      if (todayCheckin?.id) {
        const { data, error: updateError } = await supabase
          .from("mood_checkins")
          .update({ mood, shared })
          .eq("id", todayCheckin.id)
          .eq("user_id", session.user.id)
          .select(CHECKIN_SELECT)
          .single<MoodCheckin>();

        if (updateError) {
          setIsSaving(false);
          setError(updateError.message);
          return { error: updateError.message };
        }

        checkinId = data.id;
        setTodayCheckin(data);
      } else {
        const { data, error: insertError } = await supabase
          .from("mood_checkins")
          .insert({
            user_id: session.user.id,
            mood,
            shared,
          })
          .select(CHECKIN_SELECT)
          .single<MoodCheckin>();

        if (insertError) {
          setIsSaving(false);
          setError(insertError.message);
          return { error: insertError.message };
        }

        checkinId = data.id;
        setTodayCheckin(data);
      }

      if (checkinId) {
        if (shared && recipientId) {
          const { error: alertError } = await supabase.from("mood_support_alerts").upsert(
            {
              checkin_id: checkinId,
              sender_id: session.user.id,
              recipient_id: recipientId,
              sender_role: profile.role,
            },
            { onConflict: "checkin_id,recipient_id" },
          );

          if (alertError) {
            setIsSaving(false);
            setError(alertError.message);
            return { error: alertError.message };
          }
        } else {
          await supabase.from("mood_support_alerts").delete().eq("checkin_id", checkinId).eq("sender_id", session.user.id);
        }
      }

      setIsSaving(false);
      return { error: null };
    },
    [profile?.role, session?.user.id],
  );

  const markAlertViewed = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error: updateError } = await supabase
        .from("mood_support_alerts")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("recipient_id", session.user.id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setAlerts((current) => current.filter((alert) => alert.id !== id));
      return true;
    },
    [session?.user.id],
  );

  const latestAlert = useMemo(() => alerts[0] ?? null, [alerts]);

  return {
    todayCheckin,
    alerts,
    latestAlert,
    isLoaded,
    isSaving,
    error,
    saveCheckin,
    markAlertViewed,
    reloadMoodCheckin: loadMoodState,
  };
}
