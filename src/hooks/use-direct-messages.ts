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

const DIRECT_MESSAGE_SELECT = "id, sender_id, recipient_id, sender_role, text, created_at";

export function useDirectMessages() {
  const { session, profile } = useAuth();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setMessages([]);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("direct_messages")
      .select(DIRECT_MESSAGE_SELECT)
      .order("created_at", { ascending: false });

    if (loadError) {
      console.error(loadError);
      setMessages([]);
      setError(loadError.message);
      setIsLoaded(true);
      return;
    }

    setMessages((data ?? []) as DirectMessage[]);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!supabase || !session?.user.id || !profile?.role || !connection?.partner_id || !text.trim()) {
        return false;
      }

      const { error: insertError } = await supabase.from("direct_messages").insert({
        sender_id: session.user.id,
        recipient_id: connection.partner_id,
        sender_role: profile.role,
        text: text.trim(),
      });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return false;
      }

      await loadMessages();
      return true;
    },
    [connection?.partner_id, loadMessages, profile?.role, session?.user.id],
  );

  const receivedMessages = useMemo(
    () => messages.filter((message) => message.recipient_id === session?.user.id),
    [messages, session?.user.id],
  );

  return {
    messages,
    receivedMessages,
    isLoaded,
    error,
    sendMessage,
    reloadMessages: loadMessages,
  };
}
