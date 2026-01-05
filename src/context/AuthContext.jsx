import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

/**
 * Decode JWT token to extract expiry
 */
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= expiryTime;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    // Check if token is expired on load
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return storedToken;
  });
  const [loading, setLoading] = useState(true); // Start with loading true to check auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto-logout on token expiry
  const checkTokenExpiry = useCallback(() => {
    if (token && isTokenExpired(token)) {
      console.warn("Token expired, logging out...");
      logout();
      return true;
    }
    return false;
  }, [token]);

  // Check token expiry periodically (every 5 minutes)
  useEffect(() => {
    if (!token) return;

    // Check immediately
    if (checkTokenExpiry()) return;

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [token, checkTokenExpiry]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // Check if we have a valid token
      if (token && !isTokenExpired(token)) {
        // Validate token with backend (optional - can be skipped if you trust JWT expiry)
        try {
          // Optionally verify token with backend
          // const res = await api.get("/auth/verify");
          // if (res.data.valid) {
          setIsAuthenticated(true);
          connectSocket();
          // }
        } catch (error) {
          // Token invalid, clear it
          console.error("Token validation failed:", error);
          logout();
        }
      } else {
        // Token expired or missing
        if (token) {
          logout();
        }
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []); // Run only on mount

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user && token) {
      connectSocket();
    }

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, user, token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (userId, otp) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { userId, otp });
      const { token: newToken, user: newUser } = res.data;

      // Validate token before storing
      if (!newToken || isTokenExpired(newToken)) {
        throw new Error("Invalid token received");
      }

      // IMPORTANT: Set token in localStorage FIRST before making any authenticated API calls
      // This ensures the axios interceptor can pick up the token
      localStorage.setItem("token", newToken);
      setToken(newToken);

      // Try to fetch full user profile if name is missing
      let fullUser = newUser;
      if (!newUser.name && newUser.id) {
        try {
          let userRes;
          const role = (newUser.roleDetails?.name || newUser.role || "").toLowerCase();

          // Strategy 1: If admin, use the admin endpoint
          if (role === "super_admin" || role === "technical_admin") {
            try {
              userRes = await api.get(`/admin/users/${newUser.id}`);
            } catch (e) { 
              console.debug("Admin user profile fetch failed, using basic user data");
            }
          }

          // Strategy 2: If dealer, try dealer profile
          if (!userRes && (role.includes("dealer"))) {
            try {
              const dealerData = await api.get("/dealers/profile");
              if (dealerData.data) {
                userRes = { data: { ...newUser, name: dealerData.data.contactPerson } };
              }
            } catch (e) { 
              console.debug("Dealer profile fetch failed, using basic user data");
            }
          }

          // Strategy 3: Try a generic "me" endpoint if nothing else worked
          if (!userRes) {
            try {
              userRes = await api.get(`/auth/me`);
            } catch (e) {
              // Try the reported failing endpoint as a last resort, but silently
              try {
                userRes = await api.get(`/users/me`);
              } catch (innerE) { 
                console.debug("User profile endpoints failed, using basic user data");
              }
            }
          }

          if (userRes?.data && (userRes.data.name || userRes.data.fullName || userRes.data.firstName)) {
            fullUser = { ...newUser, ...userRes.data };
          }
        } catch (err) {
          // Silent fallback - the user object from verifyOTP response is usually sufficient
          console.debug("Optional user profile enrichment skipped:", err.message);
        }
      }

      // Store the final user object
      localStorage.setItem("user", JSON.stringify(fullUser));
      setUser(fullUser);
      setIsAuthenticated(true);

      // Connect socket after successful authentication
      connectSocket();

      return fullUser;
    } catch (error) {
      // Clear token if verification failed
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    // Disconnect socket before clearing data
    disconnectSocket();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  // Refresh token (optional - if backend supports it)
  const refreshToken = useCallback(async () => {
    try {
      const res = await api.post("/auth/refresh", { token });
      const { token: newToken, user: newUser } = res.data;

      if (!newToken || isTokenExpired(newToken)) {
        throw new Error("Invalid refresh token");
      }

      localStorage.setItem("token", newToken);
      if (newUser) {
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
      }
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  }, [token, logout]);

  // Get user's scope IDs
  const getUserScope = useCallback(() => {
    if (!user) return null;
    return {
      roleId: user.roleId,
      regionId: user.regionId,
      areaId: user.areaId,
      territoryId: user.territoryId,
      dealerId: user.dealerId,
      managerId: user.managerId,
      salesGroupId: user.salesGroupId,
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        verifyOTP,
        loading,
        logout,
        isAuthenticated,
        refreshToken,
        getUserScope,
        checkTokenExpiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
