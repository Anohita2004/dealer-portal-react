import React, { createContext, useState, useEffect, useContext } from "react";
import socket from "../services/socket";
import api from "../services/api";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext"; // ✅ ensure AuthContext exists

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    // 1️⃣ Fetch saved notifications from backend
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
        setUnread(res.data.notifications.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();

    // 2️⃣ Authenticate socket
    socket.emit("authenticate", { userId: user.id, role: user.role });

    // 3️⃣ Listen for real-time notifications
    socket.on("notification", (data) => {
      toast.info(`${data.title}: ${data.message}`);
      setNotifications((prev) => [data, ...prev]);
      setUnread((prev) => prev + 1);
    });

    return () => socket.off("notification");
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnread(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
