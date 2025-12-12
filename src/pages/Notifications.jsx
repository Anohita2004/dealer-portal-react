import React, { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import { X, Check, Bell, Circle } from "lucide-react";

export default function Notifications() {
  const { notifications, unread, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState("all"); // all, unread, read
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead && !n.read;
    if (filter === "read") return n.isRead || n.read;
    return true;
  });

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.isRead && !notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type/entity
    if (notification.entityType && notification.entityId) {
      const routes = {
        order: `/orders/approvals?id=${notification.entityId}`,
        invoice: `/invoices?id=${notification.entityId}`,
        payment: `/payments/finance/pending?id=${notification.entityId}`,
        document: `/documents?id=${notification.entityId}`,
        pricing: `/pricing?id=${notification.entityId}`,
        task: `/tasks`,
      };
      const route = routes[notification.entityType];
      if (route) {
        navigate(route);
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order: "📦",
      invoice: "🧾",
      payment: "💰",
      document: "📄",
      pricing: "🏷️",
      task: "✅",
    };
    return icons[type] || "🔔";
  };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        actions={[
          unread > 0 && (
            <button
              key="mark-all"
              onClick={markAllAsRead}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Mark All as Read
            </button>
          ),
        ]}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: filter === "all" ? "#3b82f6" : "#f3f4f6",
            color: filter === "all" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: filter === "all" ? 600 : 400,
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: filter === "unread" ? "#3b82f6" : "#f3f4f6",
            color: filter === "unread" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: filter === "unread" ? 600 : 400,
          }}
        >
          Unread ({unread})
        </button>
        <button
          onClick={() => setFilter("read")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: filter === "read" ? "#3b82f6" : "#f3f4f6",
            color: filter === "read" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: filter === "read" ? 600 : 400,
          }}
        >
          Read ({notifications.length - unread})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredNotifications.map((notification) => {
            const isUnread = !notification.isRead && !notification.read;
            return (
              <Card
                key={notification.id}
                style={{
                  cursor: "pointer",
                  borderLeft: isUnread ? "4px solid #3b82f6" : "4px solid transparent",
                  backgroundColor: isUnread ? "rgba(59, 130, 246, 0.05)" : "white",
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                    <div style={{ fontSize: "2rem", lineHeight: 1 }}>
                      {getNotificationIcon(notification.entityType || notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1rem",
                            fontWeight: isUnread ? 700 : 500,
                            color: "#111827",
                          }}
                        >
                          {notification.title || notification.message || "Notification"}
                        </h3>
                        {isUnread && (
                          <Circle size={8} fill="#3b82f6" style={{ marginLeft: "0.5rem" }} />
                        )}
                      </div>
                      <p
                        style={{
                          margin: "0.5rem 0",
                          color: "#6b7280",
                          fontSize: "0.875rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {notification.message || notification.description || ""}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                        <span
                          style={{
                            color: "#9ca3af",
                            fontSize: "0.75rem",
                          }}
                        >
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString()
                            : ""}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "transparent",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = "#ef4444";
                            e.target.style.backgroundColor = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = "#9ca3af";
                            e.target.style.backgroundColor = "transparent";
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Bell size={48} style={{ color: "#9ca3af", marginBottom: "1rem" }} />
            <p style={{ color: "#6b7280", fontSize: "1rem" }}>
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

