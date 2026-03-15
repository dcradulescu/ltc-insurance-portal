import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Education from "./pages/Education";
import PolicyForm from "./pages/PolicyForm";
import Strategy from "./pages/Strategy";
import Contact from "./pages/Contact";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/education"}>
        <ProtectedRoute><Education /></ProtectedRoute>
      </Route>
      <Route path={"/policy-form"}>
        <ProtectedRoute><PolicyForm /></ProtectedRoute>
      </Route>
      <Route path={"/strategy"}>
        <ProtectedRoute><Strategy /></ProtectedRoute>
      </Route>
      <Route path={"/contact"}>
        <ProtectedRoute><Contact /></ProtectedRoute>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
