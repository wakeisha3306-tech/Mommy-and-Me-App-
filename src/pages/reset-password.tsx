import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const { recoveryMode, updatePassword, error: authError } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match yet. Please try again.");
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("Your password has been updated. Taking you back into the app...");
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Secure account recovery</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">Choose a new password</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {recoveryMode
                ? "Create a new password for your account, then we'll send you back into your space."
                : "Open this page from the reset link in your email to choose a new password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">New password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30 px-4"
                placeholder="At least 6 characters"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Confirm new password</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30 px-4"
                placeholder="Enter it one more time"
                required
              />
            </label>

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

            <Button type="submit" disabled={submitting || !recoveryMode} className="h-11 w-full rounded-xl text-sm font-semibold">
              {submitting ? "Updating password..." : "Save new password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
