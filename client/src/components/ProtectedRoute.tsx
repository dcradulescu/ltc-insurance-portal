// ProtectedRoute is no longer needed since authentication is removed
// This component now simply passes through its children

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
