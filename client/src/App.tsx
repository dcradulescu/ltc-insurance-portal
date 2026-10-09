import Resources from "./pages/Resources";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { RouteScroll } from "./components/RouteScroll";
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

function Router() {
  return (
    <>
      <RouteScroll />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/education"} component={Education} />
        <Route path={"/policy-form"} component={PolicyForm} />
        <Route path={"/strategy"} component={Strategy} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/terms"} component={Terms} />
        <Route path={"/privacy"} component={PrivacyPolicy} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/academy"} component={Academy} />
        <Route path="/resources/:slug" component={Resources} />
        <Route path="/resources" component={Resources} />
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
