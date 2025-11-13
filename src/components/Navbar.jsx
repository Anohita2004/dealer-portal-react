import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import SearchInput from "./SearchInput";
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
import {
  WbSunny,
  DarkMode,
  Notifications,
  AddCircleOutline,
} from "@mui/icons-material";

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

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        backdropFilter: "blur(14px)",
        background:
          mode === "dark" ? "rgba(12,12,14,0.75)" : "rgba(255,255,255,0.8)",
        borderBottom:
          mode === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow:
          mode === "dark"
            ? "0 4px 24px rgba(0,0,0,0.4)"
            : "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ flex: 1, maxWidth: 500 }}>
        <SearchInput
          placeholder="Search modules, dealers..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Tooltip title="Create New">
          <IconButton
            sx={{
              color: "#f97316",
              "&:hover": { transform: "scale(1.1)", color: "#fb923c" },
            }}
            onClick={() => navigate("/invoices")}
          >
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        {/* 🔔 Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={handleNotifOpen}
            sx={{
              color: mode === "dark" ? "#f8fafc" : "#1e293b",
              "&:hover": { color: "#f97316" },
            }}
          >
            <Badge badgeContent={unread} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

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
              fontWeight: 500,
              color: "#f97316",
              justifyContent: "center",
              fontSize: "0.85rem",
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
                    : "rgba(249,115,22,0.08)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={!n.isRead ? 600 : 400}
                  sx={{ color: "#f97316" }}
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

        {/* 🌗 Theme toggle */}
        <Tooltip title="Toggle Theme">
          <IconButton
            onClick={toggle}
            sx={{
              color: mode === "dark" ? "#fbbf24" : "#0f172a",
              "&:hover": { color: "#f97316" },
            }}
          >
            {mode === "dark" ? <WbSunny /> : <DarkMode />}
          </IconButton>
        </Tooltip>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#f97316" }}>
              {user.name ? user.name[0].toUpperCase() : "U"}
            </Avatar>
            <div style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
              <strong>{user.name || "User"}</strong>
            </div>
          </div>
        )}

        <Tooltip title="Logout">
          <IconButton
            onClick={handleLogout}
            sx={{ color: "#ef4444", "&:hover": { transform: "scale(1.1)" } }}
          >
            🚪
          </IconButton>
        </Tooltip>
      </div>
    </nav>
  );
}
