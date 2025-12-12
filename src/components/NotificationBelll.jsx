import React, { useState } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography, Divider, Box, Button } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Bell, Check, X, Circle } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { notifications, unread, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

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
        handleClose();
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
    <>
      <IconButton 
        color="inherit" 
        onClick={handleOpen}
        sx={{ 
          position: "relative",
          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" }
        }}
      >
        <Badge 
          badgeContent={unread} 
          color="error"
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.75rem",
              height: "18px",
              minWidth: "18px",
            }
          }}
        >
          <Bell size={20} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ 
          mt: 1,
          "& .MuiPaper-root": {
            minWidth: "360px",
            maxWidth: "400px",
            maxHeight: "600px",
          }
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            Notifications {unread > 0 && `(${unread})`}
          </Typography>
          {unread > 0 && (
            <Button
              size="small"
              onClick={() => {
                markAllAsRead();
                handleClose();
              }}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        
        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: "500px", overflowY: "auto" }}>
          {notifications.length > 0 ? (
            notifications.slice(0, 10).map((n, idx) => {
              const isUnread = !n.isRead && !n.read;
              return (
                <MenuItem
                  key={n.id || idx}
                  onClick={() => handleNotificationClick(n)}
                  dense
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: isUnread ? "rgba(59, 130, 246, 0.05)" : "transparent",
                    "&:hover": {
                      backgroundColor: isUnread ? "rgba(59, 130, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                    },
                    borderLeft: isUnread ? "3px solid #3b82f6" : "3px solid transparent",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1.5, width: "100%", alignItems: "start" }}>
                    <Box
                      sx={{
                        fontSize: "1.5rem",
                        lineHeight: 1,
                        mt: 0.5,
                      }}
                    >
                      {getNotificationIcon(n.entityType || n.type)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: isUnread ? 700 : 500,
                            fontSize: "0.875rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {n.title || n.message || "Notification"}
                        </Typography>
                        {isUnread && (
                          <Circle
                            size={8}
                            fill="#3b82f6"
                            style={{ marginLeft: "0.5rem", flexShrink: 0, marginTop: "0.25rem" }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.8125rem",
                          whiteSpace: "normal",
                          lineHeight: 1.4,
                          mb: 0.5,
                        }}
                      >
                        {n.message || n.description || ""}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.75rem",
                        }}
                      >
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      sx={{
                        opacity: 0.5,
                        "&:hover": { opacity: 1, color: "error.main" },
                      }}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled sx={{ justifyContent: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </MenuItem>
          )}
        </Box>

        {notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                navigate("/notifications");
                handleClose();
              }}
              sx={{ justifyContent: "center", py: 1 }}
            >
              <Typography variant="body2" color="primary">
                View all notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
