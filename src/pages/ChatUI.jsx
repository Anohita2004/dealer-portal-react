import React, { useEffect, useState, useRef } from "react";
import api, { chatAPI } from "../services/api";
import socket, {
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  onReceiveMessage,
  onNewMessageNotification,
} from "../services/socket";

export default function ChatUI() {
  const user = JSON.parse(localStorage.getItem("user")); // logged-in user

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

  // Fetch allowed contacts
  useEffect(() => {
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
      .catch((err) => console.error("Failed to fetch contacts:", err));

    // Chat opened → reset unread
    socket.emit("chat:read");
  }, []);

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
      socket.emit("chat:read", { partnerId: partner.id });
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

        socket.emit("chat:read", { partnerId: selected.id });
        chatAPI.markRead(selected.id).catch(() => {});
      }
    });

    onNewMessageNotification((notif) => {
      console.log("🔔 New message notification:", notif);
    });
  }, [selected]);

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

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa" }}>
      {/* CONTACTS */}
      <div
        style={{
          width: "300px",
          borderRight: "1px solid #e0e0e0",
          padding: "15px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: "15px" }}>Contacts</h3>

        {contacts.length === 0 && (
          <div style={{ color: "#777" }}>No contacts available</div>
        )}

        {contacts.map((c) => (
          <div
            key={c.id}
            onClick={() => openConversation(c)}
            style={{
              padding: "12px",
              background: selected?.id === c.id ? "#eaf1ff" : "white",
              borderRadius: "8px",
              marginBottom: "10px",
              cursor: "pointer",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ fontWeight: "600", fontSize: "15px" }}>
              {c.username}
            </div>

            {/* 🔥 FIXED: Show proper role */}
            <div style={{ fontSize: "12px", color: "#666" }}>
              {c.roleDetails?.name || c.role || "unknown"}
            </div>
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          {selected ? selected.username : "Select a contact to start chatting"}
        </div>

        {/* MESSAGES */}
        <div
          ref={chatBoxRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "#f4f5f7",
          }}
        >
          {messages.map((m, idx) => {
            const isMe = m.senderId === user.id;

            return (
              <div
                key={m.id || idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background: isMe ? "#4f8cff" : "#ffffff",
                    color: isMe ? "#fff" : "#333",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    maxWidth: "70%",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    fontSize: "14px",
                  }}
                >
                  {m.body}
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.6,
                      marginTop: "6px",
                      textAlign: "right",
                    }}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: "15px",
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
