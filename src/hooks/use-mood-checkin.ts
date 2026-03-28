import { useCallback, useEffect, useMemo, useState } from "react";
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

function getUtcDayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function getMoodErrorMessage(message: string) {
  if (/mood_checkins_user_day_idx/i.test(message) || /duplicate key value/i.test(message)) {
    return "You already checked in today, so we updated today's check-in instead.";
  }

  if (/row-level security/i.test(message) || /policy/i.test(message)) {
    return "We couldn't update your shared mood alert right now. Please try again in a moment.";
  }

  return message;
}

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

    const [{ data: checkinRows, error: checkinError }, { data: alertData, error: alertError }] = await Promise.all([
      supabase.from("mood_checkins").select(CHECKIN_SELECT).eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(5),
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
      setError(getMoodErrorMessage(nextError.message));
      setIsLoaded(true);
      return;
    }

    const todayUtc = getUtcDayKey(new Date());
    const latestTodayCheckin =
      ((checkinRows ?? []) as MoodCheckin[]).find((row) => getUtcDayKey(row.created_at) === todayUtc) ?? null;

    setTodayCheckin(latestTodayCheckin);
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

      const todayUtc = getUtcDayKey(new Date());
      const { data: latestRows, error: latestError } = await supabase
        .from("mood_checkins")
        .select(CHECKIN_SELECT)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (latestError) {
        const nextError = getMoodErrorMessage(latestError.message);
        setIsSaving(false);
        setError(nextError);
        return { error: nextError };
      }

      const latestTodayCheckin =
        ((latestRows ?? []) as MoodCheckin[]).find((row) => getUtcDayKey(row.created_at) === todayUtc) ?? todayCheckin ?? null;

      let savedCheckin: MoodCheckin | null = null;

      if (latestTodayCheckin?.id) {
        const { data, error: updateError } = await supabase
          .from("mood_checkins")
          .update({ mood, shared })
          .eq("id", latestTodayCheckin.id)
          .eq("user_id", session.user.id)
          .select(CHECKIN_SELECT)
          .single<MoodCheckin>();

        if (updateError) {
          const nextError = getMoodErrorMessage(updateError.message);
          setIsSaving(false);
          setError(nextError);
          return { error: nextError };
        }

        savedCheckin = data;
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
          if (/mood_checkins_user_day_idx/i.test(insertError.message) || /duplicate key value/i.test(insertError.message)) {
            const { data: retryRows, error: retryError } = await supabase
              .from("mood_checkins")
              .select(CHECKIN_SELECT)
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false })
              .limit(5);

            if (retryError) {
              const nextError = getMoodErrorMessage(retryError.message);
              setIsSaving(false);
              setError(nextError);
              return { error: nextError };
            }

            const retryTodayCheckin =
              ((retryRows ?? []) as MoodCheckin[]).find((row) => getUtcDayKey(row.created_at) === todayUtc) ?? null;

            if (!retryTodayCheckin?.id) {
              const nextError = getMoodErrorMessage(insertError.message);
              setIsSaving(false);
              setError(nextError);
              return { error: nextError };
            }

            const { data: retryData, error: retryUpdateError } = await supabase
              .from("mood_checkins")
              .update({ mood, shared })
              .eq("id", retryTodayCheckin.id)
              .eq("user_id", session.user.id)
              .select(CHECKIN_SELECT)
              .single<MoodCheckin>();

            if (retryUpdateError) {
              const nextError = getMoodErrorMessage(retryUpdateError.message);
              setIsSaving(false);
              setError(nextError);
              return { error: nextError };
            }

            savedCheckin = retryData;
          } else {
            const nextError = getMoodErrorMessage(insertError.message);
            setIsSaving(false);
            setError(nextError);
            return { error: nextError };
          }
        } else {
          savedCheckin = data;
        }
      }

      if (!savedCheckin?.id) {
        setIsSaving(false);
        setError("We couldn't save your check-in right now.");
        return { error: "We couldn't save your check-in right now." };
      }

      if (shared && recipientId) {
        const { error: deleteAlertError } = await supabase
          .from("mood_support_alerts")
          .delete()
          .eq("checkin_id", savedCheckin.id)
          .eq("sender_id", session.user.id);

        if (deleteAlertError) {
          const nextError = getMoodErrorMessage(deleteAlertError.message);
          setIsSaving(false);
          setError(nextError);
          return { error: nextError };
        }

        const { error: insertAlertError } = await supabase.from("mood_support_alerts").insert({
          checkin_id: savedCheckin.id,
          sender_id: session.user.id,
          recipient_id: recipientId,
          sender_role: profile.role,
        });

        if (insertAlertError) {
          const nextError = getMoodErrorMessage(insertAlertError.message);
          setIsSaving(false);
          setError(nextError);
          return { error: nextError };
        }
      } else {
        const { error: clearAlertError } = await supabase
          .from("mood_support_alerts")
          .delete()
          .eq("checkin_id", savedCheckin.id)
          .eq("sender_id", session.user.id);

        if (clearAlertError) {
          const nextError = getMoodErrorMessage(clearAlertError.message);
          setIsSaving(false);
          setError(nextError);
          return { error: nextError };
        }
      }

      setTodayCheckin(savedCheckin);
      await loadMoodState();
      setIsSaving(false);
      return { error: null };
    },
    [loadMoodState, profile?.role, session?.user.id, todayCheckin],
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
        setError(getMoodErrorMessage(updateError.message));
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
