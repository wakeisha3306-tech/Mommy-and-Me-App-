import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type JournalAuthor = "Mom" | "Daughter";

export interface JournalEntry {
  id: string;
  text: string;
  author: JournalAuthor;
  is_favorite: boolean;
  created_at: string;
}

export function useJournal() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, text, author, is_favorite, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    setEntries((data ?? []) as JournalEntry[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const addEntry = (text: string, author: JournalAuthor = 'Mom') => {
    if (!supabase || !session?.user.id || !text.trim()) return Promise.resolve(false);

    return supabase
      .from("journal_entries")
      .insert({
        user_id: session.user.id,
        text: text.trim(),
        author,
      })
      .then(async ({ error }) => {
        if (error) {
          return false;
        }

        await loadEntries();
        return true;
      });
  };

  const clearEntries = async () => {
    if (!supabase || !session?.user.id) return false;
    const { error } = await supabase.from("journal_entries").delete().eq("user_id", session.user.id);
    if (error) {
      return false;
    }
    setEntries([]);
    return true;
  };

  const deleteEntry = async (id: string) => {
    if (!supabase || !session?.user.id) return false;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", session.user.id);
    if (error) {
      return false;
    }
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    return true;
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!supabase || !session?.user.id) return false;

    const { error } = await supabase
      .from("journal_entries")
      .update({ is_favorite: isFavorite })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      return false;
    }

    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, is_favorite: isFavorite } : entry)),
    );
    return true;
  };

  return { entries, isLoaded, addEntry, clearEntries, deleteEntry, toggleFavorite, reloadEntries: loadEntries };
}
