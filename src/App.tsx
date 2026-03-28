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
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";

const queryClient = new QueryClient();

function Router() {
  const { session, loading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!session && location !== "/auth") {
      navigate("/auth");
    }

    if (session && location === "/auth") {
      navigate("/");
    }
  }, [loading, location, navigate, session]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Home} />
      <Route path="/affirmations" component={Affirmations} />
      <Route path="/journal" component={Journal} />
      <Route path="/notes" component={Notes} />
      <Route path="/settings" component={SettingsPage} />
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
