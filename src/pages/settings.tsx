import { Layout } from "@/components/layout";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Settings2, Mail, LogOut, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { session, signOut } = useAuth();

  return (
    <Layout title="Settings" subtitle="Manage your account and profile space">
      <div className="section-stack mt-3">
        <section className="app-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Profile</p>
              <h2 className="mt-2 text-xl font-serif text-foreground">Your account</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This space is tied to your current login and stays private to your account.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-border/80 bg-muted/30 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Logged-in email
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{session?.user.email}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Future account options</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                More account controls can live here later, like password updates, profile preferences, and privacy settings.
              </p>
            </div>
          </div>
        </section>

        <section className="app-card-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Session</p>
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
