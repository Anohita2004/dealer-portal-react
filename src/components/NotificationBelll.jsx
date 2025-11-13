import React, { useState } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell() {
  const { notifications, unread, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={markAllAsRead}>
          <Typography variant="body2" color="primary">
            Mark all as read
          </Typography>
        </MenuItem>
        {notifications.length > 0 ? (
          notifications.slice(0, 8).map((n, idx) => (
            <MenuItem key={idx} onClick={handleClose} dense>
              <div>
                <Typography
                  variant="subtitle2"
                  fontWeight={!n.isRead ? "bold" : "normal"}
                >
                  {n.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "normal" }}
                >
                  {n.message}
                </Typography>
              </div>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No notifications</MenuItem>
        )}
      </Menu>
    </>
  );
}
