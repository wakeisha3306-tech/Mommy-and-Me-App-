import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";
import { Button } from "@/components/ui/button";
import { Settings2, Mail, LogOut, HeartHandshake, KeyRound, ShieldCheck, RefreshCcw, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatFriendlyTimestamp, getUserLabel } from "@/lib/utils";

export default function SettingsPage() {
  const { session, profile, signOut, updatePassword, updateEmail, sendPasswordReset } = useAuth();
  const { connections, partnerRole } = useConnection();
  const userLabel = getUserLabel(profile?.display_name, session?.user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const passwordLastUpdated = profile?.password_updated_at
    ? formatFriendlyTimestamp(profile.password_updated_at)
    : null;
  const connectionSummary =
    profile?.role === "Mom"
      ? connections.length > 0
        ? `${connections.length} connected daughter${connections.length === 1 ? "" : "s"}`
        : "No daughters connected yet"
      : connections.length > 0
        ? `Connected to: ${partnerRole}`
        : "Not connected yet";

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError("Please choose a password with at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Your new password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    const result = await updatePassword(newPassword);
    setChangingPassword(false);

    if (result.error) {
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Your password was updated successfully");
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(null);
    setEmailMessage(null);

    if (!newEmail.trim()) {
      setEmailError("Please enter the new email address you want to use.");
      return;
    }

    setChangingEmail(true);
    const result = await updateEmail(newEmail);
    setChangingEmail(false);

    if (result.error) {
      setEmailError(result.error);
      return;
    }

    setEmailMessage("Check your new email to confirm the change");
    setNewEmail("");
  };

  const handleSendReset = async () => {
    setResetError(null);
    setResetMessage(null);

    if (!session?.user.email) {
      setResetError("We couldn't find the current account email for this session.");
      return;
    }

    setSendingReset(true);
    const result = await sendPasswordReset(session.user.email);
    setSendingReset(false);

    if (result.error) {
      setResetError(result.error);
      return;
    }

    setResetMessage("We've sent a confirmation to your email");
  };

  return (
    <Layout title="Settings" subtitle="Manage your Between Us account and private space">
      <div className="section-stack mt-3">
        <section className="app-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Profile</p>
              <h2 className="mt-2 text-xl font-serif text-foreground">{userLabel}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your private space is connected to this account and only visible to you.
              </p>
              <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-primary/75">
                Everything you share here is private and protected.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Display name
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{profile?.display_name}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Current email
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{session?.user.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{profile?.role}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Connection
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{connectionSummary}</p>
                  </div>
                </div>
                <Link href="/connect">
                  <span className="cursor-pointer text-sm font-semibold text-primary">
                    {connections.length > 0 ? "Manage" : "Connect"}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Change password</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Update your password while staying signed in. Your current password is optional here and only for your own reference.
              </p>

              <div className="mt-3 rounded-[1.15rem] border border-border/70 bg-white/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last updated</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {passwordLastUpdated ?? "Not changed yet from inside this app"}
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current password (optional)</span>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="h-11 rounded-xl border-border bg-white/80 px-4"
                    placeholder="If you want to enter it"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">New password</span>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-11 rounded-xl border-border bg-white/80 px-4"
                    placeholder="At least 8 characters"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Confirm new password</span>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 rounded-xl border-border bg-white/80 px-4"
                    placeholder="Enter it one more time"
                    required
                  />
                </label>

                {passwordError && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {passwordError}
                  </div>
                )}

                {passwordMessage && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {passwordMessage}
                  </div>
                )}

                <Button type="submit" disabled={changingPassword} className="app-button-primary">
                  {changingPassword ? "Updating..." : "Change password"}
                </Button>
              </form>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Change email</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use a new email for this account. Supabase will ask you to confirm the change.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">New email</span>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    className="h-11 rounded-xl border-border bg-white/80 px-4"
                    placeholder="new-email@example.com"
                    required
                  />
                </label>

                {emailError && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {emailError}
                  </div>
                )}

                {emailMessage && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {emailMessage}
                  </div>
                )}

                <Button type="submit" disabled={changingEmail} className="app-button-primary">
                  {changingEmail ? "Updating..." : "Change email"}
                </Button>
              </form>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep connection updates, shared notes, direct messages, and mood alerts gentle and easy to follow.
              </p>
              <div className="mt-4">
                <Link href="/notifications">
                  <span className="cursor-pointer text-sm font-semibold text-primary">Open notification center</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Send password reset email</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                If you prefer, we can send a password reset link to your current email instead.
              </p>

              {resetError && (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {resetError}
                </div>
              )}

              {resetMessage && (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {resetMessage}
                </div>
              )}

              <div className="mt-4">
                <Button type="button" disabled={sendingReset} onClick={() => void handleSendReset()} className="app-button-secondary">
                  {sendingReset ? "Sending..." : "Send password reset email"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Account access</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You can sign out here any time. Your journal, affirmations, notes, and profile stay saved to your account.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Session</p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => void signOut()}
              className="app-button-primary flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
