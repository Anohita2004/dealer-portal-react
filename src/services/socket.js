// src/services/socket.js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("token"), // JWT from backend auth
  },
  reconnection: true,
});

export default socket;
