import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { HeartHandshake, Link2, Copy, CheckCircle2, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";
import { formatFriendlyTimestamp, getUserLabel } from "@/lib/utils";

export default function ConnectPage() {
  const { profile } = useAuth();
  const {
    connections,
    activeInvites,
    inviteLinks,
    isLoaded,
    error,
    partnerRole,
    canCreateInvite,
    inviteRestrictionMessage,
    createInvite,
    connectWithCode,
  } = useConnection();
  const initialCode = useMemo(() => {
    if (typeof window === "undefined") return "";
    const urlCode = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();
    const savedCode = window.sessionStorage.getItem("pending-connection-code")?.trim().toUpperCase();
    return urlCode ?? savedCode ?? "";
  }, []);
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  useEffect(() => {
    if (!initialCode) return;
    setInviteCode(initialCode);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("pending-connection-code", initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (!initialCode || !isLoaded || connections.length > 0 || connecting || autoConnectAttempted) {
      return;
    }

    setAutoConnectAttempted(true);
    setConnecting(true);
    setStatusMessage("Finishing your connection...");
    setSubmitError(null);

    void connectWithCode(initialCode).then((result) => {
      setConnecting(false);

      if (result.error) {
        setStatusMessage(null);
        setSubmitError(result.error);
        return;
      }

      setStatusMessage(
        result.message ??
          (profile?.role === "Mom"
            ? "You're connected now. A new Between Us space is ready for this daughter."
            : "You're connected now. Your Between Us and Family spaces are ready with Mom."),
      );
    });
  }, [autoConnectAttempted, connectWithCode, connecting, connections.length, initialCode, isLoaded, profile?.role]);

  const handleCreateInvite = async () => {
    setStatusMessage(null);
    setSubmitError(null);
    setCreatingInvite(true);
    const result = await createInvite();
    setCreatingInvite(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setStatusMessage(
      profile?.role === "Mom"
        ? "Your invite is ready. Share it with your daughter whenever you want to open her space."
        : "Your invite is ready. Share it with Mom when you're ready to connect.",
    );
  };

  const handleConnect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setSubmitError(null);
    setConnecting(true);
    const result = await connectWithCode(inviteCode);
    setConnecting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setStatusMessage(
      result.message ??
        (profile?.role === "Mom"
          ? "You're connected now. A new Between Us space is ready for this daughter."
          : "You're connected now. Your Between Us and Family spaces are ready with Mom."),
    );
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage(`${label} copied.`);
      setSubmitError(null);
    } catch {
      setSubmitError(`We couldn't copy the ${label.toLowerCase()} automatically. You can still copy it manually.`);
    }
  };

  return (
    <Layout title="Connect" subtitle="Link Mom and Daughter accounts while keeping every space intentional">
      <div className="mt-3 section-stack">
        <section className="app-feature-card p-6">
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connection</p>
                <h2 className="mt-2 text-2xl font-serif text-foreground">Keep every relationship clear and cared for</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Connecting accounts does not share anything automatically. Between Us stays one-to-one, and Family Space stays separate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {submitError || error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError ?? error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {statusMessage}
          </div>
        ) : null}

        <section className="app-card p-6">
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Loading your connection space...</p>
          ) : (
            <div className="space-y-5">
              {connections.length > 0 ? (
                <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connected relationships</p>
                      <p className="mt-1 text-lg font-serif text-foreground">
                        {profile?.role === "Mom" ? `${connections.length} daughters connected` : `Connected to ${partnerRole}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {connections.map((entry) => (
                      <div key={entry.id} className="rounded-[1.15rem] border border-border/70 bg-white/85 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                          {getUserLabel(entry.partner_name, entry.partner_email ?? undefined)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Connected since {formatFriendlyTimestamp(entry.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    Head to{" "}
                    <Link href="/notes">
                      <span className="cursor-pointer font-semibold text-primary">Notes</span>
                    </Link>{" "}
                    to write in one Between Us space at a time or use Family Space intentionally.
                  </p>
                </div>
              ) : null}

              <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Invite codes</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {profile?.role === "Mom"
                    ? "Create a gentle invite for each daughter you want to connect. Each daughter gets her own Between Us space with you."
                    : "If you're not connected yet, you can enter Mom's code here or share your own invite with her."}
                </p>

                <div className="mt-4">
                  {canCreateInvite ? (
                    <Button type="button" onClick={() => void handleCreateInvite()} disabled={creatingInvite} className="app-button-primary">
                      {creatingInvite ? "Creating..." : profile?.role === "Mom" ? "Create daughter invite" : "Create invite"}
                    </Button>
                  ) : (
                    <div className="rounded-[1.15rem] border border-primary/15 bg-primary/8 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {inviteRestrictionMessage}
                    </div>
                  )}
                </div>

                {activeInvites.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {inviteLinks.map(({ invite, link }) => (
                      <div key={invite.id} className="rounded-[1.15rem] border border-border/70 bg-white/85 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invite code</p>
                        <p className="mt-2 text-xl font-semibold tracking-[0.28em] text-foreground">{invite.code}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Created {formatFriendlyTimestamp(invite.created_at)}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Share this code or link with the person you want to connect with. Once they join, both of you will see a clear confirmation in the app.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button type="button" onClick={() => void handleCopy(invite.code, "Invite code")} className="app-button-secondary">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy code
                          </Button>
                          <Button type="button" onClick={() => void handleCopy(link, "Invite link")} className="app-button-secondary">
                            <Link2 className="mr-2 h-4 w-4" />
                            Copy link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <form onSubmit={handleConnect} className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Enter invite code</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Paste the code you were given here. Once it works, we'll clearly confirm that your connection is ready.
                </p>
                <div className="mt-4 space-y-3">
                  <Input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    className="h-11 rounded-xl border-border bg-white/80 px-4"
                    placeholder="AB12CD34EF"
                  />
                  <Button type="submit" disabled={connecting} className="app-button-primary">
                    {connecting ? "Connecting..." : "Connect accounts"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
