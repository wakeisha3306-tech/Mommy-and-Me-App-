import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAuthRedirectUrl, supabase } from "@/lib/supabase";

export type ProfileRole = "Mom" | "Daughter";
export type AgeRange = "Under 13" | "13-17" | "18+";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: ProfileRole;
  age_range: AgeRange | null;
  password_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  needsOnboarding: boolean;
  recoveryMode: boolean;
  error: string | null;
  notice: string | null;
  signUp: (
    email: string,
    password: string,
    captchaToken?: string | null,
  ) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateEmail: (email: string) => Promise<{ error: string | null }>;
  completeProfile: (displayName: string, role: ProfileRole, ageRange: AgeRange) => Promise<{ error: string | null }>;
  reloadProfile: () => Promise<void>;
  clearNotice: () => void;
  signOut: () => Promise<void>;
}

interface AccountSecurity {
  user_id: string;
  active_session_key: string | null;
  last_session_started_at: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_SELECT = "id, email, display_name, role, age_range, password_updated_at, created_at, updated_at";
const SESSION_NOTICE =
  "This account was opened on another device, so we signed you out here to keep your space private.";

function getSessionStorageKey(userId: string) {
  return `between-us-session-key:${userId}`;
}

function readLocalSessionKey(userId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getSessionStorageKey(userId));
}

function writeLocalSessionKey(userId: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getSessionStorageKey(userId), value);
}

function clearLocalSessionKey(userId?: string | null) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.removeItem(getSessionStorageKey(userId));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .maybeSingle<UserProfile>();

    if (profileError) {
      setError(profileError.message);
      return null;
    }

    return data;
  }, []);

  const upsertAccountSecurity = useCallback(async (userId: string, sessionKey: string) => {
    if (!supabase) return { error: "Supabase is not configured yet." };

    const { error: securityError } = await supabase.from("account_security").upsert({
      user_id: userId,
      active_session_key: sessionKey,
      last_session_started_at: new Date().toISOString(),
    });

    return { error: securityError?.message ?? null };
  }, []);

  const validateActiveSession = useCallback(
    async (userId: string) => {
      if (!supabase) {
        return { valid: false, message: "Supabase is not configured yet." };
      }

      const { data, error: securityError } = await supabase
        .from("account_security")
        .select("user_id, active_session_key, last_session_started_at")
        .eq("user_id", userId)
        .maybeSingle<AccountSecurity>();

      if (securityError) {
        return { valid: false, message: securityError.message };
      }

      const localSessionKey = readLocalSessionKey(userId);
      const remoteSessionKey = data?.active_session_key ?? null;

      if (!remoteSessionKey) {
        const nextSessionKey = localSessionKey ?? crypto.randomUUID();
        const result = await upsertAccountSecurity(userId, nextSessionKey);
        if (result.error) {
          return { valid: false, message: result.error };
        }
        writeLocalSessionKey(userId, nextSessionKey);
        return { valid: true, message: null };
      }

      if (!localSessionKey) {
        writeLocalSessionKey(userId, remoteSessionKey);
        return { valid: true, message: null };
      }

      if (localSessionKey !== remoteSessionKey) {
        return { valid: false, message: SESSION_NOTICE };
      }

      return { valid: true, message: null };
    },
    [upsertAccountSecurity],
  );

  const forceSingleDeviceSignOut = useCallback(
    async (message: string) => {
      const currentUserId = session?.user.id;

      setSession(null);
      setProfile(null);
      setLoading(false);
      setProfileLoading(false);
      setRecoveryMode(false);
      setNotice(message);
      setError(null);
      clearLocalSessionKey(currentUserId);

      if (supabase) {
        await supabase.auth.signOut();
      }
    },
    [session?.user.id],
  );

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    let mounted = true;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setRecoveryMode(hashParams.get("type") === "recovery");

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
      if (event === "SIGNED_OUT") {
        setRecoveryMode(false);
      }
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    (async () => {
      const [nextProfile, sessionCheck] = await Promise.all([
        fetchProfile(session.user.id),
        validateActiveSession(session.user.id),
      ]);

      if (!active) return;

      if (!sessionCheck.valid) {
        await forceSingleDeviceSignOut(sessionCheck.message ?? SESSION_NOTICE);
        return;
      }

      setProfile(nextProfile);
      setProfileLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [fetchProfile, forceSingleDeviceSignOut, session?.user?.id, validateActiveSession]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const verifySession = async () => {
      const result = await validateActiveSession(session.user.id);
      if (!result.valid) {
        await forceSingleDeviceSignOut(result.message ?? SESSION_NOTICE);
      }
    };

    const intervalId = window.setInterval(() => {
      void verifySession();
    }, 30000);

    const handleFocus = () => {
      void verifySession();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [forceSingleDeviceSignOut, session?.user?.id, validateActiveSession]);

  const needsOnboarding = Boolean(session?.user && !profileLoading && (!profile || !profile.age_range));

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      needsOnboarding,
      recoveryMode,
      error,
      notice,
      async signUp(email, password, captchaToken) {
        if (!supabase) {
          return { error: "Supabase is not configured yet.", requiresEmailConfirmation: false };
        }

        setNotice(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl("/"),
            captchaToken: captchaToken ?? undefined,
          },
        });

        return {
          error: signUpError?.message ?? null,
          requiresEmailConfirmation: Boolean(data.user && !data.session),
        };
      },
      async signIn(email, password, captchaToken) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        setNotice(null);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: captchaToken ?? undefined,
          },
        });

        if (signInError) {
          return { error: signInError.message };
        }

        const userId = data.user?.id;
        if (userId) {
          const nextSessionKey = crypto.randomUUID();
          const securityResult = await upsertAccountSecurity(userId, nextSessionKey);

          if (securityResult.error) {
            await supabase.auth.signOut();
            return { error: securityResult.error };
          }

          writeLocalSessionKey(userId, nextSessionKey);
        }

        return { error: null };
      },
      async resendConfirmation(email) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: getAuthRedirectUrl("/"),
          },
        });

        return { error: resendError?.message ?? null };
      },
      async sendPasswordReset(email, captchaToken) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl("/auth/reset-password"),
          captchaToken: captchaToken ?? undefined,
        });

        return { error: resetError?.message ?? null };
      },
      async updatePassword(password) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (!updateError) {
          if (session?.user?.id) {
            const passwordUpdatedAt = new Date().toISOString();
            const { error: profileUpdateError } = await supabase
              .from("profiles")
              .update({ password_updated_at: passwordUpdatedAt })
              .eq("id", session.user.id);

            if (!profileUpdateError) {
              setProfile((current) =>
                current ? { ...current, password_updated_at: passwordUpdatedAt } : current,
              );
            }
          }

          setRecoveryMode(false);
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }

        return { error: updateError?.message ?? null };
      },
      async updateEmail(email) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
          return { error: "Please enter the new email address you want to use." };
        }

        const { error: updateError } = await supabase.auth.updateUser(
          { email: trimmedEmail },
          {
            emailRedirectTo: getAuthRedirectUrl("/settings"),
          },
        );

        return { error: updateError?.message ?? null };
      },
      async completeProfile(displayName, role, ageRange) {
        if (!supabase || !session?.user) {
          return { error: "You need to be signed in to save your profile." };
        }

        const trimmedName = displayName.trim();
        if (!trimmedName) {
          return { error: "Please add the name you want this space to use." };
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: session.user.id,
            email: session.user.email ?? "",
            display_name: trimmedName,
            role,
            age_range: ageRange,
          })
          .select(PROFILE_SELECT)
          .single<UserProfile>();

        if (profileError) {
          return { error: profileError.message };
        }

        setProfile(data);
        setError(null);
        return { error: null };
      },
      async reloadProfile() {
        if (!session?.user?.id) return;

        setProfileLoading(true);
        const nextProfile = await fetchProfile(session.user.id);
        setProfile(nextProfile);
        setProfileLoading(false);
      },
      clearNotice() {
        setNotice(null);
      },
      async signOut() {
        if (!supabase) return;
        clearLocalSessionKey(session?.user?.id);
        setSession(null);
        setProfile(null);
        setError(null);
        setNotice(null);
        setLoading(false);
        setProfileLoading(false);
        setRecoveryMode(false);

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          setError(signOutError.message);
        }
      },
    }),
    [
      error,
      fetchProfile,
      loading,
      needsOnboarding,
      notice,
      profile,
      profileLoading,
      recoveryMode,
      session,
      upsertAccountSecurity,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
