// src/services/socket.js
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

// 🔥 Initialize socket
const socket = io(BASE_URL, {
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("token"),
  },
  reconnection: true,
});

// 🔥 When socket connects, authenticate with backend  
socket.on("connect", () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    socket.emit("authenticate", {
      userId: user.id,
      role: user.role, // role string like "dealer_admin"
    });

    console.log("🔐 Socket authenticated:", user.id, user.role);
  } catch (err) {
    console.error("Socket auth error:", err);
  }
});

// 👉 Join a specific chat (1-to-1)
export const joinChatRoom = (user1, user2) => {
  socket.emit("join_chat", { user1, user2 });
};

// 👉 Leave chat room
export const leaveChatRoom = (user1, user2) => {
  socket.emit("leave_chat", { user1, user2 });
};

// 👉 Send message
export const sendChatMessage = (msg) => {
  socket.emit("send_message", msg);
};

// 👉 Listen to messages (used inside ChatUI)
export const onReceiveMessage = (callback) => {
  socket.on("receive_message", callback);
};

// 👉 Listen to notifications
export const onNewMessageNotification = (callback) => {
  socket.on("new_message_notification", callback);
};

export default socket;
