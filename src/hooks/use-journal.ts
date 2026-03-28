import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type JournalAuthor = "Mom" | "Daughter";

export interface JournalEntry {
  id: string;
  text: string;
  author: JournalAuthor;
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
      .select("id, text, author, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
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
          console.error(error);
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
      console.error(error);
      return false;
    }
    setEntries([]);
    return true;
  };

  const deleteEntry = async (id: string) => {
    if (!supabase || !session?.user.id) return false;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) {
      console.error(error);
      return false;
    }
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    return true;
  };

  return { entries, isLoaded, addEntry, clearEntries, deleteEntry, reloadEntries: loadEntries };
}
