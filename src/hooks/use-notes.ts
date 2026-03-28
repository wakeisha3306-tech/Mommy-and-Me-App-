import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";

export type NoteAuthor = "Mom" | "Daughter";
export type NoteSpace = "private" | "between_us" | "family";

export interface Note {
  id: string;
  user_id: string;
  text: string;
  author: NoteAuthor;
  is_favorite: boolean;
  visibility: NoteSpace;
  partner_id: string | null;
  family_owner_id: string | null;
  created_at: string;
}

const NOTE_SELECT = "id, user_id, text, author, is_favorite, visibility, partner_id, family_owner_id, created_at";

function getNotesErrorMessage(message: string) {
  if (/visibility/i.test(message) && /does not exist/i.test(message)) {
    return "Your database is missing the latest notes upgrade. Run the multi-daughter family-space SQL in Supabase, then refresh.";
  }
  return message;
}

function isBetweenUsMatch(note: Note, currentUserId?: string, partnerId?: string | null) {
  if (!currentUserId || !partnerId) return false;
  return (
    note.visibility === "between_us" &&
    ((note.user_id === currentUserId && note.partner_id === partnerId) ||
      (note.user_id === partnerId && note.partner_id === currentUserId))
  );
}

export function useNotes() {
  const { session, profile } = useAuth();
  const { connection, connections, familyOwnerId } = useConnection();
  const [privateNotes, setPrivateNotes] = useState<Note[]>([]);
  const [betweenUsNotesRaw, setBetweenUsNotesRaw] = useState<Note[]>([]);
  const [familyNotes, setFamilyNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setPrivateNotes([]);
      setBetweenUsNotesRaw([]);
      setFamilyNotes([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const [{ data: privateData, error: privateError }, { data: betweenUsData, error: betweenUsError }, { data: familyData, error: familyError }] =
      await Promise.all([
        supabase
          .from("notes")
          .select(NOTE_SELECT)
          .eq("user_id", session.user.id)
          .eq("visibility", "private")
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select(NOTE_SELECT)
          .eq("visibility", "between_us")
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select(NOTE_SELECT)
          .eq("visibility", "family")
          .order("created_at", { ascending: false }),
      ]);

    const nextError = privateError ?? betweenUsError ?? familyError;
    if (nextError) {
      setPrivateNotes([]);
      setBetweenUsNotesRaw([]);
      setFamilyNotes([]);
      setError(getNotesErrorMessage(nextError.message));
      setIsLoaded(true);
      return;
    }

    setPrivateNotes((privateData ?? []) as Note[]);
    setBetweenUsNotesRaw((betweenUsData ?? []) as Note[]);
    setFamilyNotes((familyData ?? []) as Note[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (text: string, space: NoteSpace) => {
      if (!supabase || !session?.user.id || !profile?.role || !text.trim()) return false;

      const payload: Record<string, string | boolean | null> = {
        user_id: session.user.id,
        text: text.trim(),
        author: profile.role,
        visibility: space,
      };

      if (space === "between_us") {
        if (!connection?.partner_id || !familyOwnerId) return false;
        payload.partner_id = connection.partner_id;
        payload.family_owner_id = familyOwnerId;
      }

      if (space === "family") {
        if (!familyOwnerId || connections.length === 0) return false;
        payload.family_owner_id = familyOwnerId;
      }

      const { error: insertError } = await supabase.from("notes").insert(payload);

      if (insertError) {
        setError(getNotesErrorMessage(insertError.message));
        return false;
      }

      await loadNotes();
      return true;
    },
    [connection?.partner_id, connections.length, familyOwnerId, loadNotes, profile?.role, session?.user.id],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!supabase || !session?.user.id) return false;

      const { error: deleteError } = await supabase.from("notes").delete().eq("id", id).eq("user_id", session.user.id);

      if (deleteError) {
        setError(getNotesErrorMessage(deleteError.message));
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
        setError(getNotesErrorMessage(updateError.message));
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

      const updates: Record<string, string | null> = {
        visibility: space,
        partner_id: null,
        family_owner_id: null,
      };

      if (space === "between_us") {
        if (!connection?.partner_id || !familyOwnerId) return false;
        updates.partner_id = connection.partner_id;
        updates.family_owner_id = familyOwnerId;
      }

      if (space === "family") {
        if (!familyOwnerId || connections.length === 0) return false;
        updates.family_owner_id = familyOwnerId;
      }

      const { error: updateError } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (updateError) {
        setError(getNotesErrorMessage(updateError.message));
        return false;
      }

      await loadNotes();
      return true;
    },
    [connection?.partner_id, connections.length, familyOwnerId, loadNotes, session?.user.id],
  );

  const betweenUsNotes = useMemo(
    () =>
      betweenUsNotesRaw.filter((note) =>
        isBetweenUsMatch(note, session?.user.id, connection?.partner_id),
      ),
    [betweenUsNotesRaw, connection?.partner_id, session?.user.id],
  );

  const receivedBetweenUsNotes = useMemo(
    () => betweenUsNotes.filter((note) => note.user_id !== session?.user.id),
    [betweenUsNotes, session?.user.id],
  );

  const ownedBetweenUsNotes = useMemo(
    () => betweenUsNotes.filter((note) => note.user_id === session?.user.id),
    [betweenUsNotes, session?.user.id],
  );

  const receivedFamilyNotes = useMemo(
    () => familyNotes.filter((note) => note.user_id !== session?.user.id),
    [familyNotes, session?.user.id],
  );

  const latestReceivedBetweenUsNote = useMemo(
    () => receivedBetweenUsNotes[0] ?? null,
    [receivedBetweenUsNotes],
  );

  const latestReceivedFamilyNote = useMemo(
    () => receivedFamilyNotes[0] ?? null,
    [receivedFamilyNotes],
  );

  const notes = useMemo(
    () =>
      [...privateNotes, ...betweenUsNotesRaw, ...familyNotes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [betweenUsNotesRaw, familyNotes, privateNotes],
  );

  return {
    notes,
    privateNotes,
    betweenUsNotes,
    allBetweenUsNotes: betweenUsNotesRaw,
    familyNotes,
    ownedBetweenUsNotes,
    receivedBetweenUsNotes,
    receivedFamilyNotes,
    latestReceivedBetweenUsNote,
    latestReceivedFamilyNote,
    isLoaded,
    error,
    addNote,
    deleteNote,
    toggleFavorite,
    moveNoteToSpace,
    reloadNotes: loadNotes,
  };
}
