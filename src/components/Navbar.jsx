import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import SearchInput from "./SearchInput";

// Helper function to format username for display
function formatUsername(username) {
  if (!username) return "User";
  
  // Replace underscores and hyphens with spaces
  let formatted = username.replace(/[_-]/g, " ");
  
  // Capitalize first letter of each word
  formatted = formatted
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formatted;
}

import {
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";

// Lucide Icons
import {
  Sun,
  Moon,
  Bell,
  PlusCircle,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { mode, toggle } = useThemeMode();
  const { notifications, unread, markAllAsRead } = useNotifications();

  const [globalSearch, setGlobalSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotifOpen = (e) => setAnchorEl(e.currentTarget);
  const handleNotifClose = () => setAnchorEl(null);

  const isDark = mode === "dark";

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--spacing-3) var(--spacing-6)",
        backdropFilter: "blur(12px)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: 500 }}>
        <SearchInput
          placeholder="Search modules, dealers..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Create New */}
        <Tooltip title="Create New">
          <IconButton
            sx={{
              color: "var(--color-primary)",
              "&:hover": { 
                transform: "scale(1.05)", 
                color: "var(--color-primary-dark)",
                backgroundColor: "var(--color-primary-soft)"
              },
              transition: "all var(--transition-base)",
            }}
            onClick={() => navigate("/invoices")}
          >
            <PlusCircle size={22} />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={handleNotifOpen}
            sx={{
              color: "var(--color-text-primary)",
              "&:hover": { 
                color: "var(--color-primary)",
                backgroundColor: "var(--color-primary-soft)"
              },
              transition: "all var(--transition-base)",
            }}
          >
            <Badge badgeContent={unread} color="error">
              <Bell size={22} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notifications Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleNotifClose}
          PaperProps={{
            elevation: 4,
            sx: { mt: 1, minWidth: 300, borderRadius: 2, p: 0.5 },
          }}
        >
          <MenuItem
            onClick={() => {
              markAllAsRead();
              handleNotifClose();
            }}
            sx={{
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-primary)",
              justifyContent: "center",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Mark all as read
          </MenuItem>

          <Divider />

          {notifications.length > 0 ? (
            notifications.slice(0, 8).map((n, idx) => (
              <MenuItem
                key={idx}
                onClick={handleNotifClose}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.3,
                  backgroundColor: n.isRead
                    ? "transparent"
                    : "var(--color-primary-soft)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={!n.isRead ? "var(--font-weight-semibold)" : "var(--font-weight-normal)"}
                  sx={{ color: "var(--color-primary)" }}
                >
                  {n.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {n.message}
                </Typography>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </MenuItem>
          )}
        </Menu>

        {/* Theme Toggle */}
        <Tooltip title="Toggle Theme">
          <IconButton
            onClick={toggle}
            sx={{
              color: "var(--color-text-secondary)",
              "&:hover": { 
                color: "var(--color-primary)",
                backgroundColor: "var(--color-primary-soft)"
              },
              transition: "all var(--transition-base)",
            }}
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </IconButton>
        </Tooltip>

        {/* User */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: "var(--color-primary)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-semibold)"
            }}>
              {user.name 
                ? user.name[0].toUpperCase() 
                : (user.username ? user.username[0].toUpperCase() : "U")}
            </Avatar>
            <div style={{ 
              fontSize: "var(--font-size-sm)", 
              color: "var(--color-text-primary)",
              fontWeight: "var(--font-weight-medium)"
            }}>
              {user.name || (user.username ? formatUsername(user.username) : "User")}
            </div>
          </div>
        )}

        {/* Logout */}
        <Tooltip title="Logout">
          <IconButton
            onClick={handleLogout}
            sx={{ 
              color: "var(--color-error)", 
              "&:hover": { 
                transform: "scale(1.05)",
                backgroundColor: "rgba(220, 38, 38, 0.1)"
              },
              transition: "all var(--transition-base)",
            }}
          >
            <LogOut size={22} />
          </IconButton>
        </Tooltip>
      </div>
    </nav>
  );
}
