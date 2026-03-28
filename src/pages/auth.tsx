import { FormEvent, useMemo, useState } from "react";
import { HeartHandshake, LockKeyhole, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

type AuthMode = "login" | "signup";

const MIN_PASSWORD_LENGTH = 6;

export default function AuthPage() {
  const { signIn, signUp, error: authError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const helperText = useMemo(
    () =>
      mode === "signup"
        ? "Create a private account so your journal and saved affirmations stay yours."
        : "Sign back in to open your saved space.",
    [mode],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitting(false);
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    const result =
      mode === "signup"
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. If your Supabase project requires email confirmation, check your inbox before logging in.");
      return;
    }

    setMessage("Welcome back.");
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Private family journal</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">Mommy & Me</h1>
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
                  {submitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
