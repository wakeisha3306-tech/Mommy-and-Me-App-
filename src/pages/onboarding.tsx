import { FormEvent, useMemo, useState } from "react";
import { HeartHandshake, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type AgeRange, type ProfileRole, useAuth } from "@/context/auth-context";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { deriveDisplayName } from "@/lib/utils";

const ROLE_OPTIONS: ProfileRole[] = ["Mom", "Daughter"];
const AGE_OPTIONS: AgeRange[] = ["Under 13", "13-17", "18+"];

export default function OnboardingPage() {
  const { session, profile, completeProfile } = useAuth();
  const [displayName, setDisplayName] = useState(() => profile?.display_name ?? deriveDisplayName(session?.user.email));
  const [role, setRole] = useState<ProfileRole | null>(profile?.role ?? null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(profile?.age_range ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const welcomeName = useMemo(
    () => deriveDisplayName(session?.user.email).split(" ")[0] || "there",
    [session?.user.email],
  );

  const ageMessage =
    ageRange === "Under 13"
      ? "For younger children, a parent needs to start the connection first. Your private space will still work the same."
      : ageRange === "13-17"
        ? "Either side can invite, and privacy stays strict by default."
        : ageRange === "18+"
          ? "You can use the full connection flow with the same private defaults."
          : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!role) {
      setError("Choose whether this profile belongs to Mom or Daughter.");
      return;
    }

    if (!ageRange) {
      setError("Choose the age range that fits this account.");
      return;
    }

    setSubmitting(true);
    const result = await completeProfile(displayName, role, ageRange);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("between-us-show-welcome", "true");
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
            <p className="text-sm font-medium text-muted-foreground">Welcome to {APP_NAME}, {welcomeName}</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">Make it feel like home</h1>
            <p className="mt-2 text-sm font-medium text-primary/75">{APP_TAGLINE}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tell us what to call you, who this account belongs to, and the age range so we can keep connection setup gentle and safe.
            </p>
            <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-primary/75">
              Everything you share here is private and protected.
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
                        {option === "Mom" ? "A nurturing space for your reflections and care." : "A gentle space made just for you."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Age range</span>
              <div className="grid grid-cols-3 gap-3">
                {AGE_OPTIONS.map((option) => {
                  const selected = ageRange === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAgeRange(option)}
                      className={`rounded-2xl border px-3 py-4 text-center transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-muted/25 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">{option}</span>
                    </button>
                  );
                })}
              </div>
              {ageMessage ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  {ageMessage}
                </div>
              ) : null}
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
