import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Education from "./pages/Education";
import PolicyForm from "./pages/PolicyForm";
import Strategy from "./pages/Strategy";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
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

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/education"} component={Education} />
        <Route path={"/policy-form"} component={PolicyForm} />
        <Route path={"/strategy"} component={Strategy} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/terms"} component={Terms} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function AppInner() {
  const { activePolicyId } = usePolicyContext();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <TermsGate>
            <Router />
            <ChatWidget policyId={activePolicyId} />
          </TermsGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AppInner />;
}

export default App;
