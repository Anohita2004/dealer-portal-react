import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api, { chatAPI } from "../services/api";
import "./Chat.css";
import {
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  onReceiveMessage,
  onNewMessageNotification,
  emitEvent,
} from "../services/socket";

export default function ChatUI({ compact = false }) {
  const user = JSON.parse(localStorage.getItem("user")); // logged-in user
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const chatBoxRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  // Initialize socket and fetch allowed contacts
  useEffect(() => {
    // Initialize socket connection
    const socketInstance = getSocket();
    
    // Fetch allowed contacts
    api
      .get("/chat/allowed-users")
      .then((res) => {
        const raw = res.data.users || [];

        // 🔥 FIXED: map roleDetails.name → role
        const mapped = raw.map((u) => ({
          ...u,
          role: u.roleDetails?.name || "unknown",
        }));

        setContacts(mapped);
      })
      .catch((err) => {
        // Silently handle permission errors - user might not have chat access
        if (err.response?.status !== 403) {
          console.warn("Failed to fetch contacts:", err);
        }
        setContacts([]);
      });

    // Chat opened → reset unread (wait for socket to connect)
    if (socketInstance) {
      if (socketInstance.connected) {
        emitEvent("chat:read", {});
      } else {
        socketInstance.on("connect", () => {
          emitEvent("chat:read", {});
        });
      }
    }

    // Cleanup
    return () => {
      // Don't disconnect socket here as it's shared across the app
    };
  }, []);

  // Small helper to render avatar (initials) with deterministic color
  const avatarFor = (name, id) => {
    const initials = (name || "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // deterministic color from id
    const colors = ["#34D399", "#60A5FA", "#F472B6", "#F59E0B", "#A78BFA", "#FB7185"];
    const idx = Math.abs(String(id).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % colors.length;

    return (
      <div className="contact-avatar" style={{ background: colors[idx] }}>
        {initials}
      </div>
    );
  };

  // Open a chat
  const openConversation = async (partner) => {
    if (selected) leaveChatRoom(user.id, selected.id);

    setSelected(partner);
    joinChatRoom(user.id, partner.id);

    try {
      const res = await api.get(`/chat/conversation/${partner.id}`);
      setMessages(res.data.messages || []);
      scrollToBottom();

      // Reset unread for this conversation
      chatAPI.markRead(partner.id).catch(() => {});
      emitEvent("chat:read", { partnerId: partner.id });
    } catch (err) {
      console.error("Failed to load conversation", err);
    }
  };

  // Real-time incoming messages
  useEffect(() => {
    onReceiveMessage((msg) => {
      if (!selected) return;

      const room = makeRoomId(msg.senderId, msg.recipientId);
      const myRoom = makeRoomId(user.id, selected.id);

      if (room === myRoom) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();

        emitEvent("chat:read", { partnerId: selected.id });
        chatAPI.markRead(selected.id).catch(() => {});
      }
    });

    onNewMessageNotification((notif) => {
      console.log("🔔 New message notification:", notif);
    });
  }, [selected, user.id]);

  // Send a message
  const sendMessage = () => {
    if (!text.trim() || !selected) return;

    const payload = {
      senderId: user.id,
      recipientId: selected.id,
      body: text.trim(),
    };

    sendChatMessage(payload);

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: "tmp-" + Date.now(),
        senderId: user.id,
        recipientId: selected.id,
        body: text.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);

    setText("");
    scrollToBottom();
  };

  const containerStyle = compact
    ? { display: "flex", flexDirection: "column", background: "#f8f9fa", width: "100%" }
    : { display: "flex", height: "100vh", background: "#f8f9fa" };

  return (
    <div style={containerStyle}>
        <div> {!compact && (
            <button
              onClick={() => navigate("/dashboard")}
              title="Back to dashboard"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
                padding: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaArrowLeft />
            </button>
          )}
</div>      {/* CONTACTS */}
      <div
        style={
          compact
            ? {
                width: "100%",
                borderBottom: "1px solid #e0e0e0",
                padding: "10px",
                maxHeight: "260px",
                overflowY: "auto",
              }
            : {
                width: "300px",
                borderRight: "1px solid #e0e0e0",
                padding: "15px",
                overflowY: "auto",
              }
        }
      >
        <h3 style={{ marginBottom: "15px" }}>Contacts</h3>

        {contacts.length === 0 && (
          <div style={{ color: "#777" }}>No contacts available</div>
        )}

        {contacts.map((c) => (
          <div
            key={c.id}
            className={`dealer-item ${selected?.id === c.id ? "active" : ""}`}
            onClick={() => openConversation(c)}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            {avatarFor(c.username, c.id)}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{c.username}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{c.roleDetails?.name || c.role || "unknown"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div style={compact ? { display: "block" } : { flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: "600",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          
          <div>{selected ? selected.username : "Select a contact to start chatting"}</div>
        </div>

        {/* MESSAGES */}
        <div
          ref={chatBoxRef}
          style={
            compact
              ? {
                  height: "260px",
                  overflowY: "auto",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  background: "#f4f5f7",
                }
              : {
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "#f4f5f7",
                }
          }
        >
          {messages.map((m, idx) => {
            const isMe = m.senderId === user.id;
            const senderName = m.sender?.username || (m.senderId === user.id ? user.username : selected?.username);

            return (
              <div key={m.id || idx} className={`message-row ${isMe ? "outgoing-row" : "incoming-row"}`}>
                {!isMe && <div className="message-avatar-col">{avatarFor(senderName, m.senderId)}</div>}

                <div className={`message-content ${isMe ? "outgoing" : "incoming"}`}>
                  <div className="msg-text">{m.body}</div>
                  <div className="msg-meta">{new Date(m.createdAt).toLocaleString()}</div>
                </div>

                {isMe && <div className="message-avatar-col">{avatarFor(user.username, user.id)}</div>}
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: compact ? "8px" : "15px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              selected ? "Type a message..." : "Select a contact to message"
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              outline: "none",
            }}
            disabled={!selected}
          />

          <button
            onClick={sendMessage}
            disabled={!selected}
            style={{
              padding: "10px 18px",
              background: "#4f8cff",
              border: "none",
              borderRadius: "20px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility
function makeRoomId(a, b) {
  return `chat:${[a, b].sort().join("-")}`;
}
