/*import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import SearchInput from "./SearchInput";
import IconPillButton from "./IconPillButton";
import { useThemeMode } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");
  const { mode, toggle } = useThemeMode();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        padding: "0.9rem 1.5rem",
        background: "rgba(12, 12, 14, 0.75)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <img
          src="/logo192.png"
          alt="Portal Logo"
          style={{ width: "32px", height: "32px", borderRadius: "50%" }}
        />
        <strong style={{ fontSize: "1.15rem", color: "#f97316" }}>
          Dealer Portal
        </strong>
      </div>

      <div style={{ flex: 1, maxWidth: 680 }}>
        <SearchInput
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search across app..."
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <IconPillButton
          icon={mode === "dark" ? "🌙" : "☀️"}
          label={mode === "dark" ? "Dark" : "Light"}
          tone="warning"
          onClick={toggle}
        />
        <IconPillButton
          icon="🧾"
          label="New Invoice"
          tone="primary"
          onClick={() => navigate("/invoices")}
        />
        {user && (
          <span style={{ color: "#cbd5e1" }}>
            👋 Hi, <strong>{user.name || user.username}</strong>
          </span>
        )}
        <IconPillButton icon="🚪" label="Logout" tone="danger" onClick={handleLogout} />
      </div>
    </nav>
  );
}*/
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import SearchInput from "./SearchInput";
import { IconButton, Tooltip, Avatar } from "@mui/material";
import { WbSunny, DarkMode, Notifications, AddCircleOutline } from "@mui/icons-material";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { mode, toggle } = useThemeMode();
  const [globalSearch, setGlobalSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        backdropFilter: "blur(14px)",
        background:
          mode === "dark"
            ? "rgba(12,12,14,0.75)"
            : "rgba(255,255,255,0.8)",
        borderBottom:
          mode === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: mode === "dark"
          ? "0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.1)",
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

      {/* Right-side Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Tooltip title="Create New">
          <IconButton
            sx={{
              color: "#f97316",
              transition: "0.3s",
              "&:hover": {
                transform: "scale(1.1)",
                color: "#fb923c",
              },
            }}
            onClick={() => navigate("/invoices")}
          >
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            sx={{
              color: mode === "dark" ? "#f8fafc" : "#1e293b",
              "&:hover": {
                color: "#f97316",
              },
            }}
          >
            <Notifications />
          </IconButton>
        </Tooltip>

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
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#f97316",
                fontWeight: 600,
              }}
            >
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
            sx={{
              color: "#ef4444",
              "&:hover": { transform: "scale(1.1)" },
            }}
          >
            🚪
          </IconButton>
        </Tooltip>
      </div>
    </nav>
  );
}
