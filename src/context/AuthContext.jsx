import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    return res.data;
  };

  const verifyOTP = async (userId, otp) => {
    const res = await api.post("/auth/verify-otp", { userId, otp });
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    return user;
  };

  const logout = () => {
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
