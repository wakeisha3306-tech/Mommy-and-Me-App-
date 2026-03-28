import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthRedirectUrl, supabase } from "@/lib/supabase";
import { useAuth, type ProfileRole } from "@/context/auth-context";
import { getUserLabel } from "@/lib/utils";

interface PartnerProfileRow {
  id: string;
  display_name: string;
  email: string;
}

export interface ConnectionInfo {
  id: string;
  user_id: string;
  partner_id: string;
  role: ProfileRole;
  created_at: string;
  partner_name?: string | null;
  partner_email?: string | null;
}

export interface ConnectionInvite {
  id: string;
  code: string;
  role: ProfileRole;
  created_at: string;
  used_at: string | null;
}

interface ConnectionStateSnapshot {
  connections: ConnectionInfo[];
  activeInvites: ConnectionInvite[];
}

function getPartnerRole(role?: ProfileRole | null): ProfileRole | null {
  if (!role) return null;
  return role === "Mom" ? "Daughter" : "Mom";
}

function getSelectionKey(userId?: string) {
  return userId ? `between-us-active-partner:${userId}` : null;
}

export function useConnection() {
  const { session, profile } = useAuth();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [activeInvites, setActiveInvites] = useState<ConnectionInvite[]>([]);
  const [selectedPartnerId, setSelectedPartnerIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnectionState = useCallback(async (): Promise<ConnectionStateSnapshot> => {
    if (!supabase || !session?.user.id) {
      setConnections([]);
      setActiveInvites([]);
      setSelectedPartnerIdState(null);
      setError(null);
      setIsLoaded(true);
      return { connections: [], activeInvites: [] };
    }

    setIsLoaded(false);
    setError(null);

    const [{ data: connectionRows, error: connectionError }, { data: inviteRows, error: inviteError }] = await Promise.all([
      supabase
        .from("connections")
        .select("id, user_id, partner_id, role, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("connection_invites")
        .select("id, code, role, created_at, used_at")
        .eq("user_id", session.user.id)
        .is("used_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (connectionError || inviteError) {
      const nextError = connectionError?.message ?? inviteError?.message ?? "We couldn't load your connection details.";
      setConnections([]);
      setActiveInvites([]);
      setError(nextError);
      setIsLoaded(true);
      return { connections: [], activeInvites: [] };
    }

    const baseConnections = (connectionRows ?? []) as ConnectionInfo[];
    const partnerIds = [...new Set(baseConnections.map((row) => row.partner_id))];

    let partnerLookup = new Map<string, PartnerProfileRow>();
    if (partnerIds.length > 0) {
      const { data: partnerProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", partnerIds);

      if (profileError) {
        console.warn("[connection] partner profile lookup blocked or failed", {
          userId: session.user.id,
          partnerIds,
          message: profileError.message,
        });
      } else {
        partnerLookup = new Map((partnerProfiles ?? []).map((partner) => [partner.id, partner as PartnerProfileRow]));
      }
    }

    const nextConnections = baseConnections.map((row) => ({
      ...row,
      partner_name: partnerLookup.get(row.partner_id)?.display_name ?? null,
      partner_email: partnerLookup.get(row.partner_id)?.email ?? null,
    }));

    setConnections(nextConnections);
    setActiveInvites((inviteRows ?? []) as ConnectionInvite[]);
    setIsLoaded(true);
    console.debug("[connection] state loaded", {
      userId: session.user.id,
      connectionCount: nextConnections.length,
      selectedPartnerId,
    });
    return {
      connections: nextConnections,
      activeInvites: (inviteRows ?? []) as ConnectionInvite[],
    };
  }, [session?.user.id]);

  useEffect(() => {
    void loadConnectionState();
  }, [loadConnectionState]);

  useEffect(() => {
    const selectionKey = getSelectionKey(session?.user.id);
    if (!selectionKey) return;

    const storedPartnerId = typeof window !== "undefined" ? window.localStorage.getItem(selectionKey) : null;
    const nextSelected =
      connections.find((connection) => connection.partner_id === storedPartnerId)?.partner_id ??
      connections[0]?.partner_id ??
      null;

    setSelectedPartnerIdState(nextSelected);

    if (typeof window !== "undefined") {
      if (nextSelected) {
        window.localStorage.setItem(selectionKey, nextSelected);
      } else {
        window.localStorage.removeItem(selectionKey);
      }
    }
  }, [connections, session?.user.id]);

  const setSelectedPartnerId = useCallback(
    (partnerId: string) => {
      setSelectedPartnerIdState(partnerId);
      const selectionKey = getSelectionKey(session?.user.id);
      if (selectionKey && typeof window !== "undefined") {
        window.localStorage.setItem(selectionKey, partnerId);
      }
    },
    [session?.user.id],
  );

  const createInvite = useCallback(async () => {
    if (!supabase || !session?.user.id || !profile?.role) {
      return { error: "You need a completed profile before you can create an invite." };
    }

    if (profile.age_range === "Under 13" && profile.role === "Daughter") {
      return { error: "For younger children, a parent needs to start the connection first." };
    }

    if (profile.role === "Daughter" && connections.length > 0) {
      return { error: "This Daughter account is already connected to Mom." };
    }

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
    const { data, error: insertError } = await supabase
      .from("connection_invites")
      .insert({
        user_id: session.user.id,
        code,
        role: profile.role,
      })
      .select("id, code, role, created_at, used_at")
      .single<ConnectionInvite>();

    if (insertError) {
      setError(insertError.message);
      return { error: insertError.message };
    }

    setActiveInvites((current) => [data, ...current]);
    setError(null);
    return { error: null };
  }, [connections.length, profile?.age_range, profile?.role, session?.user.id]);

  const connectWithCode = useCallback(
    async (code: string) => {
      if (!supabase || !session?.user.id || !profile?.role) {
        return { error: "You need to be signed in first." };
      }

      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode) {
        return { error: "Enter the invite code you received." };
      }

      const { error: rpcError } = await supabase.rpc("accept_connection_invite", {
        invite_code: trimmedCode,
      });

      if (rpcError) {
        setError(rpcError.message);
        return { error: rpcError.message };
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("pending-connection-code");
      }

      const nextState = await loadConnectionState();
      const newestConnection = nextState.connections[nextState.connections.length - 1] ?? null;
      const partnerLabel = newestConnection
        ? getUserLabel(newestConnection.partner_name, newestConnection.partner_email ?? undefined)
        : "your connection";

      return {
        error: null,
        message:
          profile.role === "Daughter"
            ? `You're all set. ${partnerLabel} is connected now, and your Between Us space is ready.`
            : `You're connected with ${partnerLabel}. Your one-to-one space is ready now.`,
      };
    },
    [loadConnectionState, profile?.display_name, profile?.role, session?.user.email, session?.user.id],
  );

  const inviteLinks = useMemo(
    () =>
      activeInvites.map((invite) => ({
        invite,
        link: getAuthRedirectUrl(`/connect?code=${encodeURIComponent(invite.code)}`),
      })),
    [activeInvites],
  );

  const selectedConnection = useMemo(
    () => connections.find((connection) => connection.partner_id === selectedPartnerId) ?? connections[0] ?? null,
    [connections, selectedPartnerId],
  );

  const partnerRole = getPartnerRole(profile?.role);
  const familyOwnerId = useMemo(() => {
    if (!session?.user.id || !profile?.role) return null;
    return profile.role === "Mom" ? session.user.id : selectedConnection?.partner_id ?? null;
  }, [profile?.role, selectedConnection?.partner_id, session?.user.id]);

  return {
    connection: selectedConnection,
    connections,
    selectedPartnerId: selectedConnection?.partner_id ?? null,
    setSelectedPartnerId,
    activeInvite: activeInvites[0] ?? null,
    activeInvites,
    inviteLink: inviteLinks[0]?.link ?? null,
    inviteLinks,
    isLoaded,
    error,
    canCreateInvite: !(profile?.age_range === "Under 13" && profile.role === "Daughter") && !(profile?.role === "Daughter" && connections.length > 0),
    inviteRestrictionMessage:
      profile?.role === "Daughter" && connections.length > 0
        ? "This Daughter account is already linked to Mom. If you ever expand later, we can open this up more carefully."
        : profile?.age_range === "Under 13" && profile.role === "Daughter"
          ? "For younger children, Mom needs to start the connection first. You can still enter a code or link from her."
          : null,
    partnerRole,
    familyOwnerId,
    hasMultipleConnections: connections.length > 1,
    createInvite,
    connectWithCode,
    reloadConnection: loadConnectionState,
  };
}
