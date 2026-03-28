import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export interface SavedAffirmation {
  id: string;
  text: string;
  emoji: string | null;
  source: "preset" | "custom";
  is_favorite: boolean;
  created_at: string;
}

export function useAffirmations() {
  const { session } = useAuth();
  const [affirmations, setAffirmations] = useState<SavedAffirmation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAffirmations = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setAffirmations([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    const { data, error } = await supabase
      .from("affirmations")
      .select("id, text, emoji, source, is_favorite, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setAffirmations([]);
      setIsLoaded(true);
      return;
    }

    setAffirmations((data ?? []) as SavedAffirmation[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadAffirmations();
  }, [loadAffirmations]);

  const addAffirmation = useCallback(
    async (text: string, emoji: string | null, source: "preset" | "custom") => {
      if (!supabase || !session?.user.id || !text.trim()) return false;

      const { error } = await supabase.from("affirmations").insert({
        user_id: session.user.id,
        text: text.trim(),
        emoji,
        source,
      });

      if (error) {
        return false;
      }

      await loadAffirmations();
      return true;
    },
    [loadAffirmations, session?.user.id],
  );

  const deleteAffirmation = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error } = await supabase.from("affirmations").delete().eq("id", id).eq("user_id", session.user.id);

      if (error) {
        return false;
      }

      setAffirmations((current) => current.filter((affirmation) => affirmation.id !== id));
      return true;
    },
    [session?.user.id],
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      if (!supabase || !session?.user.id) return false;

      const { error } = await supabase
        .from("affirmations")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        return false;
      }

      setAffirmations((current) =>
        current.map((affirmation) =>
          affirmation.id === id ? { ...affirmation, is_favorite: isFavorite } : affirmation,
        ),
      );
      return true;
    },
    [session?.user.id],
  );

  return { affirmations, isLoaded, addAffirmation, deleteAffirmation, toggleFavorite, reloadAffirmations: loadAffirmations };
}
