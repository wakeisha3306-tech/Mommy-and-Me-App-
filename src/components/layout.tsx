import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Sparkles, BookHeart, MessageCircleHeart, LogOut, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { getUserLabel } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/affirmations", label: "Affirm", icon: Sparkles },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/notes", label: "Notes", icon: MessageCircleHeart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children, title, subtitle }: LayoutProps) {
  const [location] = useLocation();
  const { session, profile, signOut } = useAuth();
  const userLabel = getUserLabel(profile?.display_name, session?.user.email);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-background relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg px-6 pt-6">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium text-foreground">{userLabel}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {title && (
        <header className="w-full max-w-lg px-6 pt-8 pb-2 z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-serif text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 font-sans">{subtitle}</p>}
          </motion.div>
        </header>
      )}

      <motion.main
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex-1 w-full max-w-lg px-6 pt-4 pb-28 z-10 relative flex flex-col"
      >
        {children}
      </motion.main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-lg px-4 pb-5 pointer-events-auto">
          <div className="flex items-center justify-around bg-white/90 backdrop-blur-md border border-border rounded-[2rem] shadow-lg px-2 py-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all duration-200 group"
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/8"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
