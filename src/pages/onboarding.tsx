import { FormEvent, useMemo, useState } from "react";
import { HeartHandshake, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type ProfileRole, useAuth } from "@/context/auth-context";
import { deriveDisplayName } from "@/lib/utils";

const ROLE_OPTIONS: ProfileRole[] = ["Mom", "Daughter"];

export default function OnboardingPage() {
  const { session, completeProfile } = useAuth();
  const [displayName, setDisplayName] = useState(() => deriveDisplayName(session?.user.email));
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const welcomeName = useMemo(
    () => deriveDisplayName(session?.user.email).split(" ")[0] || "there",
    [session?.user.email],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!role) {
      setError("Choose whether this profile belongs to Mom or Daughter.");
      return;
    }

    setSubmitting(true);
    const result = await completeProfile(displayName, role);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-border bg-white p-7 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Welcome, {welcomeName}</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">Make it feel like home</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tell us what to call you and whether this account belongs to Mom or Daughter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Display name</span>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-12 rounded-xl border-border bg-muted/30 px-4"
                placeholder="How should we greet you?"
                required
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Role</span>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((option) => {
                  const selected = role === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-muted/25 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-semibold text-foreground">{option}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {option === "Mom" ? "A nurturing space for your reflections and notes." : "A gentle space made just for you."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl text-sm font-semibold">
              {submitting ? "Saving your profile..." : "Continue into my space"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
