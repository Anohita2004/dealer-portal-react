import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPageForRole, hasRoleAccess } from "../utils/roleNavigation";

/**
 * Loading screen component
 */
const LoadingScreen = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "var(--spacing-4)",
        background: "var(--color-background)",
      }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          border: "4px solid var(--color-border)",
          borderTop: "4px solid var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ 
        color: "var(--color-text-secondary)", 
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-family)"
      }}>Loading...</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

/**
 * ProtectedRoute - Enhanced route protection with:
 * - Loading screen until auth is restored
 * - Role-based access control
 * - Automatic redirect on unauthorized access
 * - Redirect to role-appropriate landing page
 */
export default function ProtectedRoute({ children, allowed, requireAuth = true }) {
  const { user, token, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // If route requires authentication
  if (requireAuth) {
    // User not logged in → redirect to login with return path
    if (!token || !user || !isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-protected routes
    if (allowed && allowed.length > 0 && !hasRoleAccess(user.role, allowed)) {
      // Redirect to unauthorized page or user's landing page
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

/**
 * RequireRole - Component to conditionally render based on role
 * Useful for showing/hiding UI elements based on role
 */
export function RequireRole({ children, allowed, fallback = null }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return fallback;

  if (allowed && allowed.length > 0 && !hasRoleAccess(user.role, allowed)) {
    return fallback;
  }

  return children;
}

/**
 * RoleRedirect - Automatically redirects user to their role's landing page
 * Useful for root path "/" or "/dashboard"
 */
export function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const landingPage = getLandingPageForRole(user.role);
  return <Navigate to={landingPage} replace />;
}
