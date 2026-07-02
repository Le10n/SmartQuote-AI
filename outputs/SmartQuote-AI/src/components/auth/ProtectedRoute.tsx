import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
