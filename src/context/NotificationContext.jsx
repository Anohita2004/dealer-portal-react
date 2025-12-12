import React, { createContext, useState, useEffect, useContext } from "react";
import { getSocket, onNewNotification, offNewNotification } from "../services/socket";
import { notificationAPI } from "../services/api";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await notificationAPI.getNotifications();
      setNotifications(data.notifications || data || []);
      
      // Count unread notifications
      const unreadCount = Array.isArray(data.notifications || data)
        ? (data.notifications || data).filter((n) => !n.isRead && !n.read).length
        : 0;
      setUnread(unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();

    // Set up real-time notification listeners
    const handleNewNotification = (data) => {
      console.log("📩 New notification received:", data);
      
      // Show toast notification
      toast.info(data.message || data.title || "New notification", {
        position: "top-right",
        autoClose: 5000,
      });

      // Add to notifications list
      setNotifications((prev) => [data, ...prev]);
      setUnread((prev) => prev + 1);
    };

    const handleNotificationUpdate = () => {
      // Refresh notifications when updates occur
      fetchNotifications();
    };

    const socket = getSocket();
    
    // Listen to various notification events
    onNewNotification(handleNewNotification);
    
    // Listen to order/invoice/payment updates
    socket?.on("order:pending:update", handleNotificationUpdate);
    socket?.on("invoice:pending:update", handleNotificationUpdate);
    socket?.on("payment:pending:update", handleNotificationUpdate);
    socket?.on("document:pending:update", handleNotificationUpdate);
    socket?.on("notification", handleNewNotification);
    socket?.on("notification:new", handleNewNotification);
    socket?.on("notification:update", handleNotificationUpdate);

    // Cleanup
    return () => {
      offNewNotification();
      socket?.off("order:pending:update", handleNotificationUpdate);
      socket?.off("invoice:pending:update", handleNotificationUpdate);
      socket?.off("payment:pending:update", handleNotificationUpdate);
      socket?.off("document:pending:update", handleNotificationUpdate);
      socket?.off("notification", handleNewNotification);
      socket?.off("notification:new", handleNewNotification);
      socket?.off("notification:update", handleNotificationUpdate);
    };
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnread(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
      toast.error("Failed to mark notifications as read");
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, read: true } : n
        )
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Failed to delete notification");
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unread,
        loading,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
