// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="pt-24 flex justify-center">
        <p className="text-slate-500 text-sm">Checking session…</p>
      </div>
    );
  }

  if (!user) {
    const intendedPath =
      location.pathname + location.search + (location.hash ?? "");
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: intendedPath || "/" }}
      />
    );
  }

  return <Outlet />;
}
