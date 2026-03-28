import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, HeartHandshake, LockKeyhole, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { useAuth } from "@/context/auth-context";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

type AuthMode = "login" | "signup";

const MIN_PASSWORD_LENGTH = 6;
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
const isCaptchaConfigured = Boolean(turnstileSiteKey);

export default function AuthPage() {
  const { signIn, signUp, resendConfirmation, sendPasswordReset, error: authError, notice, clearNotice } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const helperText = useMemo(
    () =>
      mode === "signup"
        ? "Create your private account and keep your reflections, notes, and saved moments close."
        : "Sign back in to your private space.",
    [mode],
  );

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaResetKey((current) => current + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    clearNotice();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitting(false);
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (isCaptchaConfigured && !captchaToken) {
      setSubmitting(false);
      setError("Please complete the bot protection check before continuing.");
      return;
    }

    if (mode === "signup") {
      const result = await signUp(email.trim(), password, captchaToken);
      setSubmitting(false);
      resetCaptcha();

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        result.requiresEmailConfirmation
          ? "Check your email to confirm your account before logging in."
          : "Your account is ready. Let's finish setting up your space.",
      );
      setShowSignupSuccess(result.requiresEmailConfirmation);
      return;
    }

    const result = await signIn(email.trim(), password, captchaToken);
    setSubmitting(false);
    resetCaptcha();

    if (result.error) {
      if (/email.*not confirmed/i.test(result.error)) {
        setShowSignupSuccess(true);
        setMessage("Check your email to confirm your account before logging in.");
        return;
      }
      setError(result.error);
      return;
    }

    setMessage("Welcome back.");
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError("Enter the same email address you used to sign up.");
      return;
    }

    setResending(true);
    setError(null);
    clearNotice();
    const result = await resendConfirmation(email.trim());
    setResending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("A fresh confirmation email is on its way.");
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    clearNotice();

    if (!email.trim()) {
      setSubmitting(false);
      setError("Enter your email address and we'll send you a reset link.");
      return;
    }

    if (isCaptchaConfigured && !captchaToken) {
      setSubmitting(false);
      setError("Please complete the bot protection check before continuing.");
      return;
    }

    const result = await sendPasswordReset(email.trim(), captchaToken);
    setSubmitting(false);
    resetCaptcha();

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("Password reset email sent. Check your inbox for the secure reset link.");
  };

  if (showSignupSuccess) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
          <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">One more step</p>
              <h1 className="mt-2 font-serif text-4xl text-foreground">Check your inbox</h1>
              <p className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary">
                Check your email to confirm your account before logging in.
              </p>
              {email && <p className="mt-3 text-sm text-muted-foreground">We sent the confirmation to {email}.</p>}
            </div>

            {(error || authError) && (
              <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error ?? authError}
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {message}
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => void handleResendConfirmation()}
                disabled={resending}
                className="h-11 w-full rounded-xl text-sm font-semibold"
              >
                {resending ? "Sending again..." : "Resend confirmation email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSignupSuccess(false);
                  setMode("login");
                  setError(null);
                  setMessage(null);
                  clearNotice();
                  resetCaptcha();
                }}
                className="h-11 w-full rounded-xl text-sm font-semibold"
              >
                Back to login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
          <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setError(null);
                setMessage(null);
                clearNotice();
              }}
              className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Password help</p>
              <h1 className="mt-2 font-serif text-4xl text-foreground">Reset your password</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Enter your email and we'll send you a secure link to choose a new password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-xl border-border bg-muted/30 pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              {isCaptchaConfigured && turnstileSiteKey && (
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onTokenChange={setCaptchaToken}
                  resetKey={captchaResetKey}
                />
              )}

              {(error || authError) && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error ?? authError}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {message}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl text-sm font-semibold">
                {submitting ? "Sending reset link..." : "Send reset link"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/75">Private connection app</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">{APP_NAME}</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{APP_TAGLINE}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helperText}</p>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted p-1">
              <TabsTrigger value="login" className="rounded-xl">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value={mode} className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 rounded-xl border-border bg-muted/30 pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Password</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 rounded-xl border-border bg-muted/30 pl-10"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </label>

                {isCaptchaConfigured && turnstileSiteKey && (
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    onTokenChange={setCaptchaToken}
                    resetKey={captchaResetKey}
                  />
                )}

                {(error || authError) && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error ?? authError}
                  </div>
                )}

                {notice && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {notice}
                  </div>
                )}

                {message && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {message}
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl text-sm font-semibold">
                  {submitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
                </Button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError(null);
                      setMessage(null);
                    }}
                    className="w-full text-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot your password?
                  </button>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
