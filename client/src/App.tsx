import Login from "./pages/Login";
import Documents from "./pages/Documents";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Education from "./pages/Education";
import PolicyForm from "./pages/PolicyForm";
import Strategy from "./pages/Strategy";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Academy from "./pages/Academy";
import { ChatWidget } from "./components/ChatWidget";
import { TermsGate } from "./components/TermsGate";
import { usePolicyContext } from "./contexts/PolicyContext";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);
  return null;
}

function PrivatePage({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  if (loading) return <p className="p-10 text-center" role="status">Checking your session…</p>;
  if (error) return <p className="p-10 text-center" role="alert">Unable to check your session. Please reload the page.</p>;
  if (!user) return <Redirect to={`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`} />;
  return <div key={user.id}>{children}</div>;
}
function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path={"/"} component={Home} />
        <Route path={"/education"} component={Education} />
        <Route path={"/policy-form"}><PrivatePage><PolicyForm /></PrivatePage></Route>
        <Route path={"/strategy"}><PrivatePage><Strategy /></PrivatePage></Route>
        <Route path={"/contact"} component={Contact} />
        <Route path={"/terms"} component={Terms} />
        <Route path={"/privacy"} component={PrivacyPolicy} />
        <Route path="/documents"><PrivatePage><Documents /></PrivatePage></Route>
        <Route path={"/profile"}><PrivatePage><Profile /></PrivatePage></Route>
        <Route path={"/academy"} component={Academy} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function AppInner() {
  const { activePolicyId } = usePolicyContext();
  const { user } = useAuth();
  const [location] = useLocation();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {location === "/login" ? <Router /> : <TermsGate>
            <Router />
            {user ? <ChatWidget key={user.id} policyId={activePolicyId} /> : null}
          </TermsGate>}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

export default App;
