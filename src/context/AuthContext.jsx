import React, { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    // 👇 return the backend response to the Login component
    return res.data;
  };

  const verifyOTP = async (userId, otp) => {
    const res = await api.post("/auth/verify-otp", { userId, otp });
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

