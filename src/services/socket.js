// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

// =========================================================
// INITIALIZE SOCKET
// =========================================================
export const connectSocket = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) return null;

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("🔌 Socket Connected:", socket.id);
      if (socket && socket.id && user) {
        socket.emit("authenticate", {
          userId: user.id,
          role: user.role,
          username: user.username
        });
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }

  return socket;
};

// =========================================================
// SAFE ACCESSOR
// =========================================================
export const getSocket = () => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// =========================================================
// CHAT EVENTS
// =========================================================
// Join user's personal room (for receiving all messages)
export const joinUserRoom = (data) => getSocket()?.emit("join_user_room", data);

// Join chat room between two users
export const joinChatRoom = (u1, u2) => getSocket()?.emit("join_chat", { u1, u2 });
export const leaveChatRoom = (u1, u2) => getSocket()?.emit("leave_chat", { u1, u2 });

// Send message via socket
export const sendChatMessage = (msg) => getSocket()?.emit("send_message", msg);

// Message event handlers
export const onReceiveMessage = (cb) => getSocket()?.on("receive_message", cb);
export const offReceiveMessage = () => getSocket()?.off("receive_message");

export const onNewMessageNotification = (cb) => getSocket()?.on("new_message_notification", cb);
export const offNewMessageNotification = () => getSocket()?.off("new_message_notification");

export const onMessageSent = (cb) => getSocket()?.on("message_sent", cb);
export const offMessageSent = () => getSocket()?.off("message_sent");

export const onMessageError = (cb) => getSocket()?.on("message_error", cb);
export const offMessageError = () => getSocket()?.off("message_error");

// Typing indicators
export const onTyping = (cb) => getSocket()?.on("typing", cb);
export const offTyping = () => getSocket()?.off("typing");

// User presence
export const onUserOnline = (cb) => getSocket()?.on("user_online", cb);
export const onUserOffline = (cb) => getSocket()?.on("user_offline", cb);

// General notifications
export const onNewNotification = (cb) => getSocket()?.on("notification:new", cb);
export const offNewNotification = () => getSocket()?.off("notification:new");

// dynamic event shortcuts
export const onEvent = (e, cb) => getSocket()?.on(e, cb);
export const offEvent = (e) => getSocket()?.off(e);

export const emitEvent = (e, data) => getSocket()?.emit(e, data);

export const isSocketConnected = () => getSocket()?.connected || false;
export const getSocketId = () => getSocket()?.id;

// =========================================================
// FLEET TRACKING EVENTS
// =========================================================

// Join tracking rooms
export const trackTruck = (truckId) => getSocket()?.emit("track_truck", { truckId });
export const untrackTruck = (truckId) => getSocket()?.emit("untrack_truck", { truckId });

export const trackOrder = (orderId) => getSocket()?.emit("track_order", { orderId });
export const untrackOrder = (orderId) => getSocket()?.emit("untrack_order", { orderId });

export const joinFleetScope = (data) => getSocket()?.emit("join_fleet_scope", data);

// Listen to fleet events
export const onTruckLocationUpdate = (cb) => getSocket()?.on("truck:location:update", cb);
export const offTruckLocationUpdate = () => getSocket()?.off("truck:location:update");

export const onTruckStatusChange = (cb) => getSocket()?.on("truck:status:change", cb);
export const offTruckStatusChange = () => getSocket()?.off("truck:status:change");

export const onOrderTrackingUpdate = (cb) => getSocket()?.on("order:tracking:update", cb);
export const offOrderTrackingUpdate = () => getSocket()?.off("order:tracking:update");

// 🚨 REMOVED THIS ↓
// export default socket;

// Instead ⬇ ensures no null import
export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  sendChatMessage,
  onReceiveMessage,
  onTyping,
  emitEvent
};
