import React, { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { toast } from "react-toastify";
import "./Chat.css";

export default function DealerChat() {
  const [messages, setMessages] = useState([]);
  const [manager, setManager] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // 🔹 Fetch manager info for this dealer
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/dealers/my-manager"); // you can create this small endpoint
        setManager(res.data.manager);
      } catch {
        toast.error("Failed to load manager info");
      }
    })();
  }, []);

  // 🔹 Fetch existing conversation
  useEffect(() => {
    if (!manager) return;
    (async () => {
      const res = await api.get(`/messages/conversation/${manager.id}`);
      setMessages(res.data.messages || []);
    })();
  }, [manager]);

  // 🔹 Realtime updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("message:new", (msg) => {
      if (
        msg.senderId === manager?.id ||
        msg.recipientId === manager?.id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.disconnect();
  }, [manager]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !manager) return;
    try {
      const res = await api.post("/messages", {
        recipientId: manager.id,
        subject: "Chat",
        body: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="chat-container">
      <main className="chat-main">
        {manager ? (
          <>
            <header className="chat-header">
              <h3>Chat with {manager.username}</h3>
            </header>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-bubble ${
                    msg.senderId === manager.id ? "incoming" : "outgoing"
                  }`}
                >
                  <div className="msg-body">{msg.body}</div>
                  <div className="msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p className="empty-chat">Loading manager info...</p>
        )}
      </main>
    </div>
  );
}
