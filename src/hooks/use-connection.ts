import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthRedirectUrl, supabase } from "@/lib/supabase";
import { useAuth, type ProfileRole } from "@/context/auth-context";

export interface ConnectionInfo {
  id: string;
  user_id: string;
  partner_id: string;
  role: ProfileRole;
  created_at: string;
}

export interface ConnectionInvite {
  id: string;
  code: string;
  role: ProfileRole;
  created_at: string;
  used_at: string | null;
}

function getPartnerRole(role?: ProfileRole | null): ProfileRole | null {
  if (!role) return null;
  return role === "Mom" ? "Daughter" : "Mom";
}

export function useConnection() {
  const { session, profile } = useAuth();
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [activeInvite, setActiveInvite] = useState<ConnectionInvite | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnectionState = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setConnection(null);
      setActiveInvite(null);
      setError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(null);

    const [{ data: connectionData, error: connectionError }, { data: inviteData, error: inviteError }] =
      await Promise.all([
        supabase
          .from("connections")
          .select("id, user_id, partner_id, role, created_at")
          .eq("user_id", session.user.id)
          .maybeSingle<ConnectionInfo>(),
        supabase
          .from("connection_invites")
          .select("id, code, role, created_at, used_at")
          .eq("user_id", session.user.id)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<ConnectionInvite>(),
      ]);

    if (connectionError || inviteError) {
      const nextError = connectionError?.message ?? inviteError?.message ?? "We couldn't load your connection details.";
      setError(nextError);
      setConnection(null);
      setActiveInvite(null);
      setIsLoaded(true);
      return;
    }

    setConnection(connectionData ?? null);
    setActiveInvite(inviteData ?? null);
    setIsLoaded(true);
  }, [session?.user.id]);

  useEffect(() => {
    void loadConnectionState();
  }, [loadConnectionState]);

  const createInvite = useCallback(async () => {
    if (!supabase || !session?.user.id || !profile?.role) {
      return { error: "You need a completed profile before you can create an invite." };
    }

    if (connection) {
      return { error: "This account is already connected." };
    }

    if (activeInvite) {
      console.debug("[connection] reusing active invite", { code: activeInvite.code });
      setError(null);
      return { error: null };
    }

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
    console.debug("[connection] creating invite", {
      userId: session.user.id,
      role: profile.role,
      code,
    });
    const { data, error } = await supabase
      .from("connection_invites")
      .insert({
        user_id: session.user.id,
        code,
        role: profile.role,
      })
      .select("id, code, role, created_at, used_at")
      .single<ConnectionInvite>();

    if (error) {
      console.error("[connection] createInvite failed", error);
      setError(error.message);
      return { error: error.message };
    }

    console.debug("[connection] invite created", data);
    setActiveInvite(data);
    setError(null);
    return { error: null };
  }, [activeInvite, connection, profile?.role, session?.user.id]);

  const connectWithCode = useCallback(
    async (code: string) => {
      if (!supabase || !session?.user.id) {
        return { error: "You need to be signed in first." };
      }

      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode) {
        return { error: "Enter the invite code you received." };
      }

      console.debug("[connection] accepting invite", {
        userId: session.user.id,
        code: trimmedCode,
      });
      const { error } = await supabase.rpc("accept_connection_invite", {
        invite_code: trimmedCode,
      });

      if (error) {
        console.error("[connection] connectWithCode failed", error);
        setError(error.message);
        return { error: error.message };
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("pending-connection-code");
      }

      console.debug("[connection] invite accepted", { code: trimmedCode });
      await loadConnectionState();
      return { error: null };
    },
    [loadConnectionState, session?.user.id],
  );

  const inviteLink = useMemo(() => {
    if (!activeInvite) return null;
    return getAuthRedirectUrl(`/connect?code=${encodeURIComponent(activeInvite.code)}`);
  }, [activeInvite]);

  return {
    connection,
    activeInvite,
    inviteLink,
    isLoaded,
    error,
    partnerRole: getPartnerRole(profile?.role),
    createInvite,
    connectWithCode,
    reloadConnection: loadConnectionState,
  };
}
