import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_role: "Mom" | "Daughter";
  text: string;
  created_at: string;
}

interface UseDirectMessagesOptions {
  activePartnerId?: string | null;
}

const DIRECT_MESSAGE_SELECT = "id, sender_id, recipient_id, sender_role, text, created_at";
export const NEED_TO_TALK_MESSAGE = "Hey, can we talk? 💛";

export function useDirectMessages(options: UseDirectMessagesOptions = {}) {
  const { session, profile } = useAuth();
  const { connection } = useConnection();
  const activePartnerId = options.activePartnerId ?? connection?.partner_id ?? null;
  const [allMessages, setAllMessages] = useState<DirectMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setAllMessages([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    try {
      const { data, error: loadError } = await supabase
        .from("direct_messages")
        .select(DIRECT_MESSAGE_SELECT)
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (loadError) {
        console.error("[direct-messages] load failed", {
          userId: session.user.id,
          activePartnerId,
          message: loadError.message,
        });
        setAllMessages([]);
        setError(loadError.message);
        setIsLoaded(true);
        return;
      }

      console.debug("[direct-messages] load success", {
        userId: session.user.id,
        activePartnerId,
        count: data?.length ?? 0,
      });
      setAllMessages((data ?? []) as DirectMessage[]);
      setIsLoaded(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "We couldn't load your messages right now.";
      console.error("[direct-messages] unexpected load error", {
        userId: session.user.id,
        activePartnerId,
        message,
      });
      setAllMessages([]);
      setError(message);
      setIsLoaded(true);
    }
  }, [activePartnerId, session?.user.id]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const messages = useMemo(() => {
    if (!activePartnerId || !session?.user.id) return [];
    return allMessages.filter(
      (message) =>
        (message.sender_id === session.user.id && message.recipient_id === activePartnerId) ||
        (message.sender_id === activePartnerId && message.recipient_id === session.user.id),
    );
  }, [activePartnerId, allMessages, session?.user.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!supabase || !session?.user.id || !profile?.role || !activePartnerId || !text.trim()) {
        return false;
      }

      const { error: insertError } = await supabase.from("direct_messages").insert({
        sender_id: session.user.id,
        recipient_id: activePartnerId,
        sender_role: profile.role,
        text: text.trim(),
      });

      if (insertError) {
        console.error("[direct-messages] send failed", {
          userId: session.user.id,
          activePartnerId,
          message: insertError.message,
        });
        setError(insertError.message);
        return false;
      }

      console.debug("[direct-messages] send success", {
        userId: session.user.id,
        activePartnerId,
      });
      await loadMessages();
      return true;
    },
    [activePartnerId, loadMessages, profile?.role, session?.user.id],
  );

  const receivedMessages = useMemo(
    () => allMessages.filter((message) => message.recipient_id === session?.user.id),
    [allMessages, session?.user.id],
  );

  const latestReceivedMessage = useMemo(() => receivedMessages[0] ?? null, [receivedMessages]);

  return {
    messages,
    allMessages,
    receivedMessages,
    latestReceivedMessage,
    isLoaded,
    error,
    sendMessage,
    reloadMessages: loadMessages,
  };
}
