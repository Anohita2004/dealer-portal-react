import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowed }) {
  const { user, token, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // User not logged in → redirect to login
  if (!token || !user) return <Navigate to="/login" replace />;

  // Role-protected routes (e.g., allowed = ["super_admin", "technical_admin"])
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
