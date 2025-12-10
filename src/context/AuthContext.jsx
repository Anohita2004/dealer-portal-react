import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  // Connect socket on mount if user is already logged in
  useEffect(() => {
    if (user && token) {
      connectSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (userId, otp) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { userId, otp });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);

      // Connect socket after successful authentication
      connectSocket();

      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Disconnect socket before clearing data
    disconnectSocket();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, verifyOTP, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
