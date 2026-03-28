import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export type ReactionItemType = "note" | "direct_message";
export type ReactionValue = "💛" | "🤍" | "🫶" | "I'm here";

export interface MomentReaction {
  id: string;
  item_type: ReactionItemType;
  item_id: string;
  user_id: string;
  reaction: ReactionValue;
  created_at: string;
}

interface UseReactionsOptions {
  noteIds?: string[];
  directMessageIds?: string[];
}

const REACTION_SELECT = "id, item_type, item_id, user_id, reaction, created_at";
const REACTION_VALUES: ReactionValue[] = ["💛", "🤍", "🫶", "I'm here"];

function isMissingReactionTable(message: string) {
  return /moment_reactions/i.test(message) && /(does not exist|schema cache)/i.test(message);
}

export function getReactionChoices() {
  return REACTION_VALUES;
}

export function useReactions(options: UseReactionsOptions = {}) {
  const { session } = useAuth();
  const noteIds = options.noteIds ?? [];
  const directMessageIds = options.directMessageIds ?? [];
  const [reactions, setReactions] = useState<MomentReaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const loadReactions = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setReactions([]);
      setIsLoaded(true);
      setError(null);
      return;
    }

    if (!isAvailable) {
      setReactions([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const loads = [];
    if (noteIds.length > 0) {
      loads.push(
        supabase
          .from("moment_reactions")
          .select(REACTION_SELECT)
          .eq("item_type", "note")
          .in("item_id", noteIds),
      );
    }
    if (directMessageIds.length > 0) {
      loads.push(
        supabase
          .from("moment_reactions")
          .select(REACTION_SELECT)
          .eq("item_type", "direct_message")
          .in("item_id", directMessageIds),
      );
    }

    if (loads.length === 0) {
      setReactions([]);
      setIsLoaded(true);
      return;
    }

    const results = await Promise.all(loads);
    const nextError = results.find((result) => result.error)?.error;

    if (nextError) {
      if (isMissingReactionTable(nextError.message)) {
        setIsAvailable(false);
        setReactions([]);
        setIsLoaded(true);
        return;
      }

      setError(nextError.message);
      setReactions([]);
      setIsLoaded(true);
      return;
    }

    const nextReactions = results.flatMap((result) => (result.data ?? []) as MomentReaction[]);
    setReactions(nextReactions);
    setIsLoaded(true);
  }, [directMessageIds, isAvailable, noteIds, session?.user.id]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  const toggleReaction = useCallback(
    async (itemType: ReactionItemType, itemId: string, reaction: ReactionValue) => {
      if (!supabase || !session?.user.id || !isAvailable) return false;

      const existing = reactions.find(
        (item) => item.item_type === itemType && item.item_id === itemId && item.user_id === session.user.id,
      );

      if (existing?.reaction === reaction) {
        const { error: deleteError } = await supabase
          .from("moment_reactions")
          .delete()
          .eq("id", existing.id)
          .eq("user_id", session.user.id);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        setReactions((current) => current.filter((item) => item.id !== existing.id));
        return true;
      }

      const payload = {
        item_type: itemType,
        item_id: itemId,
        user_id: session.user.id,
        reaction,
      };

      const { data, error: upsertError } = await supabase
        .from("moment_reactions")
        .upsert(payload, { onConflict: "user_id,item_type,item_id" })
        .select(REACTION_SELECT)
        .single<MomentReaction>();

      if (upsertError) {
        if (isMissingReactionTable(upsertError.message)) {
          setIsAvailable(false);
          return false;
        }
        setError(upsertError.message);
        return false;
      }

      setReactions((current) => {
        const rest = current.filter(
          (item) => !(item.item_type === itemType && item.item_id === itemId && item.user_id === session.user.id),
        );
        return [...rest, data];
      });
      return true;
    },
    [isAvailable, reactions, session?.user.id],
  );

  const getItemReactions = useCallback(
    (itemType: ReactionItemType, itemId: string) => reactions.filter((item) => item.item_type === itemType && item.item_id === itemId),
    [reactions],
  );

  const getUserReaction = useCallback(
    (itemType: ReactionItemType, itemId: string) =>
      reactions.find(
        (item) => item.item_type === itemType && item.item_id === itemId && item.user_id === session?.user.id,
      )?.reaction ?? null,
    [reactions, session?.user.id],
  );

  const groupedCounts = useMemo(() => {
    const map = new Map<string, Record<ReactionValue, number>>();
    for (const reaction of reactions) {
      const key = `${reaction.item_type}:${reaction.item_id}`;
      const counts =
        map.get(key) ??
        {
          "💛": 0,
          "🤍": 0,
          "🫶": 0,
          "I'm here": 0,
        };
      counts[reaction.reaction] += 1;
      map.set(key, counts);
    }
    return map;
  }, [reactions]);

  const getReactionCounts = useCallback(
    (itemType: ReactionItemType, itemId: string) =>
      groupedCounts.get(`${itemType}:${itemId}`) ?? {
        "💛": 0,
        "🤍": 0,
        "🫶": 0,
        "I'm here": 0,
      },
    [groupedCounts],
  );

  return {
    reactions,
    isLoaded,
    error,
    isAvailable,
    toggleReaction,
    getItemReactions,
    getUserReaction,
    getReactionCounts,
    reloadReactions: loadReactions,
  };
}
