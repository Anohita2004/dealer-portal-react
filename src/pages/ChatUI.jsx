import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { chatAPI } from "../services/api";
import {
  getSocket,
  joinUserRoom,
  joinChatRoom,
  leaveChatRoom,
  onReceiveMessage,
  onNewMessageNotification,
  onMessageSent,
  onMessageError,
  onTyping,
  emitEvent,
} from "../services/socket";
import "./Chat.css";

// Format role name for display
const formatRoleName = (roleName) => {
  if (!roleName) return "Unknown";
  return roleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ChatUI({ compact = false }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [allowedUsers, setAllowedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [groupedUsers, setGroupedUsers] = useState({});

  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  // Fetch allowed users
  useEffect(() => {
    const fetchAllowedUsers = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getAllowedUsers();
        const users = response.users || [];

        // Group users by role
        const grouped = users.reduce((acc, user) => {
          const role = user.roleName || "other";
          if (!acc[role]) acc[role] = [];
          acc[role].push(user);
          return acc;
        }, {});

        setAllowedUsers(users);
        setFilteredUsers(users);
        setGroupedUsers(grouped);
      } catch (error) {
        // Handle 403 Forbidden gracefully (user doesn't have permission for chat)
        if (error.response?.status === 403 || error.silent) {
          // Silently handle - user doesn't have chat access
          setAllowedUsers([]);
          setFilteredUsers([]);
        } else {
          // Only show error for non-permission issues
          console.error("Error fetching allowed users:", error);
          toast.error("Failed to load contacts");
          setAllowedUsers([]);
          setFilteredUsers([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAllowedUsers();
    }
  }, [token]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allowedUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allowedUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.roleName?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, allowedUsers]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    const socket = getSocket();
    if (!socket) return;

    socketRef.current = socket;

    // Join user's personal room
    joinUserRoom({ userId: user.id });

    // Listen for new messages
    const handleReceiveMessage = (message) => {
      if (selectedUser && message.senderId === selectedUser.id) {
        // Message in current conversation
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        // Mark as read
        chatAPI.markRead(selectedUser.id).catch(() => {});
      } else {
        // Message from another user - update unread count
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Listen for message notifications
    const handleNotification = (notification) => {
      if (selectedUser && notification.senderId === selectedUser.id) {
        return; // Already handling in current conversation
      }
      toast.info(`New message from ${notification.sender?.username || "someone"}`);
      updateUnreadCount();
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      // Handle both formats: data.userId or data.user1/user2
      const typingUserId = data.userId || (data.user1 === selectedUser?.id ? data.user2 : data.user2 === selectedUser?.id ? data.user1 : null);
      if (typingUserId === selectedUser?.id || (data.user1 === user.id && data.user2 === selectedUser?.id) || (data.user2 === user.id && data.user1 === selectedUser?.id)) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(selectedUser.id);
          } else {
            newSet.delete(selectedUser.id);
          }
          return newSet;
        });
      }
    };

    // Listen for message errors
    const handleMessageError = (error) => {
      if (error.error === "not_allowed_to_message_user") {
        toast.error("You are not allowed to message this user");
      } else if (error.error === "missing_required_fields") {
        toast.error("Please fill in all required fields");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
      setSending(false);
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      if (data.message) {
        setMessages((prev) => {
          // Replace optimistic update with real message
          const filtered = prev.filter((m) => !m.id?.startsWith("tmp-"));
          return [...filtered, data.message];
        });
        scrollToBottom();
      }
      setSending(false);
    };

    onReceiveMessage(handleReceiveMessage);
    onNewMessageNotification(handleNotification);
    onTyping(handleTyping);
    onMessageError(handleMessageError);
    onMessageSent(handleMessageSent);

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection lost. Attempting to reconnect...");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // Server disconnected, need to reconnect manually
        socket.connect();
      }
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("new_message_notification", handleNotification);
        socket.off("typing", handleTyping);
        socket.off("message_error", handleMessageError);
        socket.off("message_sent", handleMessageSent);
        socket.off("connect_error");
        socket.off("disconnect");
      }
    };
  }, [user, token, selectedUser, scrollToBottom]);

  // Load unread count
  const updateUnreadCount = useCallback(async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      // Silently handle 403 Forbidden (user doesn't have permission for chat)
      if (error.response?.status !== 403) {
        console.error("Error fetching unread count:", error);
      }
      // Set to 0 if error (including 403)
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    updateUnreadCount();
    // Refresh unread count periodically (only if user has chat access)
    const interval = setInterval(() => {
      updateUnreadCount();
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateUnreadCount]);

  // Load conversation when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    const loadConversation = async () => {
      try {
        const response = await chatAPI.getConversation(selectedUser.id);
        setMessages(response.messages || []);
        scrollToBottom();

        // Mark messages as read
        await chatAPI.markRead(selectedUser.id).catch(() => {
          // Silently handle errors when marking as read
        });
        updateUnreadCount();
      } catch (error) {
        // Handle 403 Forbidden gracefully
        if (error.response?.status === 403) {
          // User doesn't have permission - silently handle
          setMessages([]);
        } else {
          console.error("Error loading conversation:", error);
          toast.error("Failed to load conversation");
        }
      }
    };

    loadConversation();
  }, [selectedUser, scrollToBottom, updateUnreadCount]);

  // Handle typing indicator
  useEffect(() => {
    if (!selectedUser || !socketRef.current) return;

    const handleInputChange = () => {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.emit("typing", {
          user1: user.id,
          user2: selectedUser.id,
          isTyping: true,
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit("typing", {
          user1: user.id,
          user2: selectedUser.id,
          isTyping: false,
        });
      }, 1000);
    };

    // This will be triggered by the input onChange
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && socketRef.current) {
        socketRef.current.emit("typing", {
          user1: user.id,
          user2: selectedUser.id,
          isTyping: false,
        });
      }
    };
  }, [selectedUser, user.id, isTyping]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;

    // Check if user is in allowed list (frontend validation)
    const canMessage = allowedUsers.some((u) => u.id === selectedUser.id);
    if (!canMessage) {
      toast.error("This user is not available for messaging based on your role permissions.");
      return;
    }

    setSending(true);

    try {
      const response = await chatAPI.sendMessage({
        recipientId: selectedUser.id,
        body: newMessage.trim(),
      });

      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          id: response.message?.id || `tmp-${Date.now()}`,
          senderId: user.id,
          recipientId: selectedUser.id,
          body: newMessage.trim(),
          status: "sent",
          createdAt: new Date().toISOString(),
          sender: {
            id: user.id,
            username: user.username,
            role: user.roleName,
          },
        },
      ]);

      setNewMessage("");
      scrollToBottom();

      // Also send via socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          senderId: user.id,
          recipientId: selectedUser.id,
          body: newMessage.trim(),
          subject: "",
        });
      }
    } catch (error) {
      // Don't log silent errors
      if (!error.silent) {
        console.error("Error sending message:", error);
      }
      
      if (error.response?.status === 403) {
        toast.error("You are not allowed to message this user. Please contact your administrator.");
      } else if (error.response?.status === 400) {
        toast.error("Please fill in all required fields");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.message === "Failed to fetch") {
        toast.error("Network error. Please check your connection.");
      } else if (!error.silent) {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  // Open conversation
  const openConversation = (partner) => {
    if (selectedUser) {
      leaveChatRoom(user.id, selectedUser.id);
    }

    setSelectedUser(partner);
    joinChatRoom(user.id, partner.id);
  };

  // Avatar component
  const avatarFor = (name, id) => {
    const initials = (name || "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const colors = ["#34D399", "#60A5FA", "#F472B6", "#F59E0B", "#A78BFA", "#FB7185"];
    const idx = Math.abs(String(id).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % colors.length;

    return (
      <div className="contact-avatar" style={{ background: colors[idx] }}>
        {initials}
      </div>
    );
  };

  const containerStyle = compact
    ? { display: "flex", flexDirection: "column", background: "#f8f9fa", width: "100%" }
    : { display: "flex", height: "100vh", background: "#f8f9fa" };

  // Group filtered users by role
  const filteredGrouped = filteredUsers.reduce((acc, user) => {
    const role = user.roleName || "other";
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {});

  return (
    <div style={containerStyle}>
      {!compact && (
        <div style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
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
        </div>
      )}

      {/* CONTACTS SIDEBAR */}
      <div
        style={
          compact
            ? {
                width: "100%",
                borderBottom: "1px solid #e0e0e0",
                padding: "15px",
                maxHeight: "260px",
                overflowY: "auto",
              }
            : {
                width: "320px",
                borderRight: "1px solid #e0e0e0",
                padding: "15px",
                overflowY: "auto",
                background: "#fff",
              }
        }
      >
        <div style={{ marginBottom: "15px" }}>
          <h3 style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            Contacts
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {unreadCount}
              </span>
            )}
          </h3>

          {/* Search Input */}
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999",
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 8px 8px 32px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#777", textAlign: "center", padding: "20px" }}>Loading contacts...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ color: "#777", textAlign: "center", padding: "20px" }}>
            {searchQuery ? "No contacts found" : "No contacts available"}
          </div>
        ) : (
          <div>
            {Object.entries(filteredGrouped).map(([role, users]) => (
              <div key={role} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#666",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    paddingLeft: "4px",
                  }}
                >
                  {formatRoleName(role)} ({users.length})
                </div>
                {users.map((contact) => (
                  <div
                    key={contact.id}
                    className={`dealer-item ${selectedUser?.id === contact.id ? "active" : ""}`}
                    onClick={() => openConversation(contact)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginBottom: "4px",
                    }}
                  >
                    {avatarFor(contact.username, contact.id)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: "6px" }}>
                        {contact.username}
                        {contact.roleName && (
                          <span
                            style={{
                              fontSize: "10px",
                              background: "#e5e7eb",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              color: "#666",
                            }}
                          >
                            {formatRoleName(contact.roleName)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>{contact.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div style={compact ? { display: "block" } : { flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedUser ? (
          <>
            {/* Conversation Header */}
            <div
              style={{
                padding: "15px",
                borderBottom: "1px solid #e0e0e0",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {avatarFor(selectedUser.username, selectedUser.id)}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "16px" }}>{selectedUser.username}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {formatRoleName(selectedUser.roleName)}
                  {typingUsers.has(selectedUser.id) && (
                    <span style={{ marginLeft: "8px", color: "#3b82f6", fontStyle: "italic" }}>typing...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
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
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === user.id;
                  const senderName =
                    m.sender?.username || (m.senderId === user.id ? user.username : selectedUser?.username);

                  return (
                    <div key={m.id || idx} className={`message-row ${isMe ? "outgoing-row" : "incoming-row"}`}>
                      {!isMe && <div className="message-avatar-col">{avatarFor(senderName, m.senderId)}</div>}

                      <div className={`message-content ${isMe ? "outgoing" : "incoming"}`}>
                        <div className="msg-text">{m.body}</div>
                        <div className="msg-meta">
                          {new Date(m.createdAt).toLocaleString()}
                          {isMe && m.status && (
                            <span style={{ marginLeft: "6px" }}>
                              {m.status === "read" ? "✓✓" : m.status === "sent" ? "✓" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {isMe && <div className="message-avatar-col">{avatarFor(user.username, user.id)}</div>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div
              style={{
                padding: compact ? "8px" : "15px",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                gap: "10px",
                background: "#fff",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // Trigger typing indicator
                  if (socketRef.current && selectedUser) {
                    if (!isTyping) {
                      setIsTyping(true);
                      socketRef.current.emit("typing", {
                        user1: user.id,
                        user2: selectedUser.id,
                        isTyping: true,
                      });
                    }

                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }

                    typingTimeoutRef.current = setTimeout(() => {
                      setIsTyping(false);
                      socketRef.current.emit("typing", {
                        user1: user.id,
                        user2: selectedUser.id,
                        isTyping: false,
                      });
                    }, 1000);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "20px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: "14px",
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                style={{
                  padding: "10px 18px",
                  background: newMessage.trim() && !sending ? "#4f8cff" : "#ccc",
                  border: "none",
                  borderRadius: "20px",
                  color: "#fff",
                  cursor: newMessage.trim() && !sending ? "pointer" : "not-allowed",
                  fontWeight: "600",
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "16px",
            }}
          >
            Select a contact to start a conversation
          </div>
        )}
      </div>
    </div>
  );
}
