import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { LoadingScreen } from "@/components/loading-screen";
import Home from "@/pages/home";
import Affirmations from "@/pages/affirmations";
import Journal from "@/pages/journal";
import Notes from "@/pages/notes";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import ConnectPage from "@/pages/connect";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import ResetPasswordPage from "@/pages/reset-password";

const queryClient = new QueryClient();

function Router() {
  const { session, loading, needsOnboarding, profileLoading, recoveryMode } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (loading || (session && profileLoading)) return;

    const currentUrl = typeof window !== "undefined" ? new URL(window.location.href) : null;
    const pendingConnectionCode =
      typeof window !== "undefined" ? window.sessionStorage.getItem("pending-connection-code") : null;

    if (!session && currentUrl?.pathname.endsWith("/connect")) {
      const inviteCode = currentUrl.searchParams.get("code")?.trim().toUpperCase();
      if (inviteCode) {
        window.sessionStorage.setItem("pending-connection-code", inviteCode);
      }
    }

    if (recoveryMode && location !== "/auth/reset-password") {
      navigate("/auth/reset-password");
      return;
    }

    if (!session && location !== "/auth") {
      if (location === "/auth/reset-password") return;
      navigate("/auth");
    }

    if (session && needsOnboarding && location !== "/onboarding" && location !== "/auth/reset-password") {
      navigate("/onboarding");
    }

    if (session && !needsOnboarding && pendingConnectionCode && location !== "/connect") {
      navigate(`/connect?code=${encodeURIComponent(pendingConnectionCode)}`);
      return;
    }

    if (session && !needsOnboarding && !recoveryMode && (location === "/auth" || location === "/onboarding")) {
      navigate("/");
    }
  }, [loading, location, navigate, needsOnboarding, profileLoading, recoveryMode, session]);

  if (loading || (session && profileLoading)) {
    return <LoadingScreen message={session ? "Loading your profile..." : "Loading your space..."} />;
  }

  if (!session) {
    if (location === "/auth/reset-password") {
      return <ResetPasswordPage />;
    }
    return <AuthPage />;
  }

  if (recoveryMode) {
    return <ResetPasswordPage />;
  }

  if (needsOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/" component={Home} />
      <Route path="/affirmations" component={Affirmations} />
      <Route path="/journal" component={Journal} />
      <Route path="/notes" component={Notes} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/connect" component={ConnectPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
