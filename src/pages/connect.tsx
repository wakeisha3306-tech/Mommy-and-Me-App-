import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { HeartHandshake, Link2, Copy, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnection } from "@/hooks/use-connection";
import { formatFriendlyTimestamp } from "@/lib/utils";

export default function ConnectPage() {
  const {
    connection,
    activeInvite,
    inviteLink,
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

  useEffect(() => {
    if (!initialCode) return;
    setInviteCode(initialCode);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("pending-connection-code", initialCode);
    }
  }, [initialCode]);

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

    setStatusMessage("Your invite is ready to copy and share.");
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

    setStatusMessage("You're connected now. Shared notes can be seen by both of you when you mark them as shared.");
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
    <Layout title="Connect" subtitle="Link Mom and Daughter, then decide what gets shared">
      <div className="mt-3 section-stack">
        <section className="app-feature-card p-6">
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connection</p>
                <h2 className="mt-2 text-2xl font-serif text-foreground">Keep your space private, then share on purpose</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Connecting accounts does not share anything automatically. Only notes you mark as shared become visible to both of you.
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
          ) : connection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connected</p>
                  <p className="mt-1 text-lg font-serif text-foreground">Connected to: {partnerRole}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Your connection has been active since {formatFriendlyTimestamp(connection.created_at)}.
              </p>
              <p className="text-sm text-muted-foreground">
                Head to{" "}
                <Link href="/notes">
                  <span className="cursor-pointer font-semibold text-primary">Notes</span>
                </Link>{" "}
                to share something intentionally.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Invite code</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Create one code, then text it or copy the link. Your partner can paste the code on this screen to connect.
                </p>

                {activeInvite ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[1.15rem] border border-primary/15 bg-white/85 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current code</p>
                      <p className="mt-2 text-xl font-semibold tracking-[0.28em] text-foreground">{activeInvite.code}</p>
                    </div>
                    {inviteLink ? (
                      <div className="rounded-[1.15rem] border border-border/70 bg-white/85 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invite link</p>
                        <p className="mt-2 break-all text-sm text-foreground">{inviteLink}</p>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={() => void handleCopy(activeInvite.code, "Invite code")} className="app-button-secondary">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy code
                      </Button>
                      {inviteLink ? (
                        <Button type="button" onClick={() => void handleCopy(inviteLink, "Invite link")} className="app-button-secondary">
                          <Link2 className="mr-2 h-4 w-4" />
                          Copy link
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    {canCreateInvite ? (
                      <Button type="button" onClick={() => void handleCreateInvite()} disabled={creatingInvite} className="app-button-primary">
                        {creatingInvite ? "Creating..." : "Create invite"}
                      </Button>
                    ) : (
                      <div className="rounded-[1.15rem] border border-primary/15 bg-primary/8 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        {inviteRestrictionMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleConnect} className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Enter invite code</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Paste the code from Mom or Daughter here to link your accounts.
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
