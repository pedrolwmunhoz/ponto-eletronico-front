import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { TipoUsuario } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: TipoUsuario[];
}

export function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && userType && !allowedTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
