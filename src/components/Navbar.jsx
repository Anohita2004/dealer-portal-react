import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import SearchInput from "./SearchInput";
import { getRoleName } from "../utils/authUtils";

import {
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  ListItemIcon,
  Paper,
  Button
} from "@mui/material";

// Lucide Icons
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Mail
} from "lucide-react";

// Helper function to format username for display
function formatUsername(username) {
  if (!username) return "User";
  let formatted = username.replace(/[_-]/g, " ");
  formatted = formatted
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return formatted;
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { mode, toggle } = useThemeMode();
  const { notifications, unread, markAllAsRead } = useNotifications();

  const [globalSearch, setGlobalSearch] = useState("");
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = getRoleName(user);
  const isDark = mode === "dark";

  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 2rem",
        backdropFilter: "blur(20px)",
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Search Bar */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        <SearchInput
          placeholder="Search portal (⌘K)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Theme Toggle */}
        <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
          <IconButton
            onClick={toggle}
            sx={{
              color: "text.secondary",
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              "&:hover": { color: "primary.main", bgcolor: "primary.soft" },
              transition: "all 0.2s",
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{
              color: "text.secondary",
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              "&:hover": { color: "primary.main", bgcolor: "primary.soft" },
              transition: "all 0.2s",
            }}
          >
            <Badge badgeContent={unread} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Profile */}
        {user && (
          <Box
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              ml: 1,
              p: '4px 8px',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid transparent',
              "&:hover": {
                bgcolor: 'action.hover',
                borderColor: 'divider'
              }
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
                fontWeight: 700,
                boxShadow: '0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary-soft)'
              }}
            >
              {user.name ? user.name[0] : (user.username ? user.username[0] : "U")}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {user.name || formatUsername(user.username)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                {role?.replace('_', ' ')}
              </Typography>
            </Box>
            <ChevronDown size={14} color="gray" />
          </Box>
        )}

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              width: 360,
              maxHeight: 480,
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Notifications</Typography>
            {unread > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ fontWeight: 700, textTransform: 'none' }}>
                Mark all as read
              </Button>
            )}
          </Box>
          <Divider />
          <Box sx={{ overflowY: 'auto', maxHeight: 380 }}>
            {notifications.length > 0 ? (
              notifications.map((n, idx) => (
                <MenuItem
                  key={idx}
                  onClick={() => setNotifAnchor(null)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: n.isRead ? 'transparent' : 'primary.soft',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                  }}
                >
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 'var(--radius-md)', bgcolor: 'background.paper' }}>
                    <Mail size={16} color="var(--color-primary)" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3 }}>{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{n.message}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No new notifications</Typography>
              </Box>
            )}
          </Box>
        </Menu>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              width: 240,
              borderRadius: 'var(--radius-xl)',
              border: '1px solid',
              borderColor: 'divider',
              p: 1
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{user?.name || user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email || 'Authenticated User'}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={() => { setProfileAnchor(null); navigate('/profile'); }} sx={{ borderRadius: 'var(--radius-md)', py: 1 }}>
            <ListItemIcon><UserIcon size={18} /></ListItemIcon>
            <Typography variant="body2" fontWeight={600}>My Profile</Typography>
          </MenuItem>
          <MenuItem onClick={() => setProfileAnchor(null)} sx={{ borderRadius: 'var(--radius-md)', py: 1 }}>
            <ListItemIcon><Settings size={18} /></ListItemIcon>
            <Typography variant="body2" fontWeight={600}>Settings</Typography>
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ borderRadius: 'var(--radius-md)', py: 1, color: 'error.main' }}>
            <ListItemIcon><LogOut size={18} color="rgba(220, 38, 38, 0.8)" /></ListItemIcon>
            <Typography variant="body2" fontWeight={700}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

