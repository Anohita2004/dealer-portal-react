import React, { useEffect, useState } from "react";
import api, { dealerAPI } from "../services/api";
import { getSocket, onEvent, offEvent } from "../services/socket";
import { toast } from "react-toastify";
import "./Chat.css";

export default function ManagerChat() {
  const [dealers, setDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🟢 1️⃣ Load all dealers managed by this manager (with linked user)
  useEffect(() => {
    (async () => {
      try {
        const data = await dealerAPI.getDealers();
        const dealerList = Array.isArray(data)
          ? data
          : data.dealers || data.data || [];

        // Map dealers to include their linked user info
        const formatted = dealerList.map((d) => ({
          dealerId: d.id,
          businessName: d.businessName,
          userId: d.users?.[0]?.id || null,
          username: d.users?.[0]?.username || "No user linked",
          lastMessage: null,
          unread: false,
        }));

        setDealers(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dealers");
      }
    })();
  }, []);

  // 🟣 2️⃣ Fetch messages for selected dealer
  useEffect(() => {
    if (!selectedDealer) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/messages/conversation/${selectedDealer.userId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedDealer]);

  // 🟠 3️⃣ Setup socket for real-time message updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      // only add messages related to current chat
      if (
        msg.senderId === selectedDealer?.userId ||
        msg.recipientId === selectedDealer?.userId
      ) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // mark other dealers as having unread messages
        setDealers((prev) =>
          prev.map((d) =>
            d.userId === msg.senderId ? { ...d, unread: true } : d
          )
        );
      }
    };

    onEvent("message:new", handleMessage);

    return () => {
      offEvent("message:new");
      // Don't disconnect socket here as it's shared across the app
    };
  }, [selectedDealer]);

  // 🟤 4️⃣ Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDealer) return;

    try {
      const res = await api.post("/messages", {
        recipientId: selectedDealer.userId,
        subject: "Chat",
        body: newMessage.trim(),
      });

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage("");

      // update dealer preview
      setDealers((prev) =>
        prev.map((d) =>
          d.userId === selectedDealer.userId
            ? { ...d, lastMessage: newMessage.trim(), unread: false }
            : d
        )
      );
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar with dealer list */}
      <aside className="chat-sidebar">
        <h2>💼 My Dealers</h2>
        {dealers.length === 0 ? (
          <p className="empty-chat">No dealers assigned</p>
        ) : (
          dealers.map((dealer) => (
            <div
              key={dealer.userId || dealer.dealerId}
              className={`dealer-item ${
                selectedDealer?.userId === dealer.userId ? "active" : ""
              } ${dealer.unread ? "unread" : ""}`}
              onClick={() => {
                if (!dealer.userId)
                  return toast.error("Dealer has no linked user account");
                setSelectedDealer(dealer);
                setDealers((prev) =>
                  prev.map((d) =>
                    d.userId === dealer.userId ? { ...d, unread: false } : d
                  )
                );
              }}
            >
              <div className="dealer-name">{dealer.businessName}</div>
              {dealer.lastMessage && (
                <div className="last-message">{dealer.lastMessage}</div>
              )}
              {dealer.unread && <span className="unread-dot" />}
            </div>
          ))
        )}
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {selectedDealer ? (
          <>
            <header className="chat-header">
              <h3>Chat with {selectedDealer.businessName}</h3>
            </header>

            <div className="chat-messages">
              {loading ? (
                <p className="empty-chat">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="empty-chat">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      msg.senderId === selectedDealer.userId
                        ? "incoming"
                        : "outgoing"
                    }`}
                  >
                    <div className="msg-body">{msg.body}</div>
                    <div className="msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              )}
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
          <div className="empty-chat">Select a dealer to start chatting</div>
        )}
      </main>
    </div>
  );
}
