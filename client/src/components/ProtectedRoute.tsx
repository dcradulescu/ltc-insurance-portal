import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login with returnPath so user comes back after auth
      window.location.href = getLoginUrl(location);
    }
  }, [loading, isAuthenticated, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-serif font-semibold text-foreground">Verifying your account...</p>
            <p className="text-sm text-muted-foreground">For your protection, we need to verify your identity</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Account Required</h2>
          <p className="text-muted-foreground">
            This page contains sensitive information. Please log in or create an account to continue. Your data is protected and secure.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
