import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type NoteAuthor = "Mom" | "Daughter";

export interface Note {
  id: string;
  text: string;
  author: NoteAuthor;
  is_favorite: boolean;
  created_at: string;
}

export function useNotes() {
  const { session } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setNotes([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);
    const { data, error } = await supabase
      .from("notes")
      .select("id, text, author, is_favorite, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setNotes([]);
      setError(
        error.code === "PGRST205"
          ? "The notes table is not set up in Supabase yet. Run the SQL in supabase-schema.sql to enable notes sync."
          : error.message,
      );
      setIsLoaded(true);
      return;
    }

    setNotes((data ?? []) as Note[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (text: string, author: NoteAuthor) => {
      if (!supabase || !session?.user.id || !text.trim()) return false;

      const { error } = await supabase.from("notes").insert({
        user_id: session.user.id,
        text: text.trim(),
        author,
      });

      if (error) {
        console.error(error);
        setError(
          error.code === "PGRST205"
            ? "The notes table is not set up in Supabase yet. Run the SQL in supabase-schema.sql to enable notes sync."
            : error.message,
        );
        return false;
      }

      await loadNotes();
      return true;
    },
    [loadNotes, session?.user.id],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", session.user.id);

      if (error) {
        console.error(error);
        setError(error.message);
        return false;
      }

      setNotes((current) => current.filter((note) => note.id !== id));
      return true;
    },
    [session?.user.id],
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      if (!supabase || !session?.user.id) return false;

      const { error } = await supabase
        .from("notes")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error(error);
        setError(error.message);
        return false;
      }

      setNotes((current) => current.map((note) => (note.id === id ? { ...note, is_favorite: isFavorite } : note)));
      return true;
    },
    [session?.user.id],
  );

  return { notes, isLoaded, error, addNote, deleteNote, toggleFavorite, reloadNotes: loadNotes };
}
