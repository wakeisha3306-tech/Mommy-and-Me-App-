import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type NoteAuthor = "Mom" | "Daughter";
export type NoteSpace = "private" | "shared";

export interface Note {
  id: string;
  user_id: string;
  text: string;
  author: NoteAuthor;
  is_favorite: boolean;
  is_shared: boolean;
  created_at: string;
}

const NOTE_SELECT = "id, user_id, text, author, is_favorite, is_shared, created_at";

export function useNotes() {
  const { session, profile } = useAuth();
  const [privateNotes, setPrivateNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setPrivateNotes([]);
      setSharedNotes([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const [{ data: privateData, error: privateError }, { data: sharedData, error: sharedError }] = await Promise.all([
      supabase
        .from("notes")
        .select(NOTE_SELECT)
        .eq("user_id", session.user.id)
        .eq("is_shared", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("notes")
        .select(NOTE_SELECT)
        .eq("is_shared", true)
        .order("created_at", { ascending: false }),
    ]);

    const nextError = privateError ?? sharedError;
    if (nextError) {
      console.error(nextError);
      setPrivateNotes([]);
      setSharedNotes([]);
      setError(nextError.message);
      setIsLoaded(true);
      return;
    }

    setPrivateNotes((privateData ?? []) as Note[]);
    setSharedNotes((sharedData ?? []) as Note[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (text: string, space: NoteSpace) => {
      if (!supabase || !session?.user.id || !profile?.role || !text.trim()) return false;

      const { error: insertError } = await supabase.from("notes").insert({
        user_id: session.user.id,
        text: text.trim(),
        author: profile.role,
        is_shared: space === "shared",
      });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return false;
      }

      await loadNotes();
      return true;
    },
    [loadNotes, profile?.role, session?.user.id],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error: deleteError } = await supabase.from("notes").delete().eq("id", id).eq("user_id", session.user.id);

      if (deleteError) {
        console.error(deleteError);
        setError(deleteError.message);
        return false;
      }

      await loadNotes();
      return true;
    },
    [loadNotes, session?.user.id],
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      if (!supabase || !session?.user.id) return false;

      const { error: updateError } = await supabase
        .from("notes")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (updateError) {
        console.error(updateError);
        setError(updateError.message);
        return false;
      }

      await loadNotes();
      return true;
    },
    [loadNotes, session?.user.id],
  );

  const moveNoteToSpace = useCallback(
    async (id: string, space: NoteSpace) => {
      if (!supabase || !session?.user.id) return false;

      const { error: updateError } = await supabase
        .from("notes")
        .update({ is_shared: space === "shared" })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (updateError) {
        console.error(updateError);
        setError(updateError.message);
        return false;
      }

      await loadNotes();
      return true;
    },
    [loadNotes, session?.user.id],
  );

  const receivedSharedNotes = useMemo(
    () => sharedNotes.filter((note) => note.user_id !== session?.user.id),
    [session?.user.id, sharedNotes],
  );

  const ownedSharedNotes = useMemo(
    () => sharedNotes.filter((note) => note.user_id === session?.user.id),
    [session?.user.id, sharedNotes],
  );

  const notes = useMemo(
    () => [...privateNotes, ...sharedNotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [privateNotes, sharedNotes],
  );

  return {
    notes,
    privateNotes,
    sharedNotes,
    ownedSharedNotes,
    receivedSharedNotes,
    isLoaded,
    error,
    addNote,
    deleteNote,
    toggleFavorite,
    moveNoteToSpace,
    reloadNotes: loadNotes,
  };
}
