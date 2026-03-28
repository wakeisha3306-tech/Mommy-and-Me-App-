import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export interface RealMoment {
  id: string;
  text: string;
  created_at: string;
}

export function useRealMoments() {
  const { session } = useAuth();
  const [moments, setMoments] = useState<RealMoment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoments = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setMoments([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const { data, error } = await supabase
      .from("real_moments")
      .select("id, text, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMoments([]);
      setError(
        error.code === "PGRST205"
          ? "The real moments table is not set up in Supabase yet. Run the newest SQL to enable it."
          : error.message,
      );
      setIsLoaded(true);
      return;
    }

    setMoments((data ?? []) as RealMoment[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadMoments();
  }, [loadMoments]);

  const addMoment = useCallback(
    async (text: string) => {
      if (!supabase || !session?.user.id || !text.trim()) return false;

      const { error } = await supabase.from("real_moments").insert({
        user_id: session.user.id,
        text: text.trim(),
      });

      if (error) {
        console.error(error);
        setError(
          error.code === "PGRST205"
            ? "The real moments table is not set up in Supabase yet. Run the newest SQL to enable it."
            : error.message,
        );
        return false;
      }

      await loadMoments();
      return true;
    },
    [loadMoments, session?.user.id],
  );

  const deleteMoment = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error } = await supabase.from("real_moments").delete().eq("id", id).eq("user_id", session.user.id);

      if (error) {
        console.error(error);
        setError(error.message);
        return false;
      }

      setMoments((current) => current.filter((moment) => moment.id !== id));
      return true;
    },
    [session?.user.id],
  );

  return { moments, isLoaded, error, addMoment, deleteMoment, reloadMoments: loadMoments };
}
