import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
        padding: "1rem 2rem",
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <img
          src="/logo192.png"
          alt="Portal Logo"
          style={{ width: "32px", height: "32px", borderRadius: "50%" }}
        />
        <strong style={{ fontSize: "1.2rem", color: "#60a5fa" }}>
          Dealer Portal
        </strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user && (
          <span style={{ color: "#cbd5e1" }}>
            👋 Hi, <strong>{user.name || user.username}</strong>
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1.2rem",
            color: "#fff",
            fontWeight: "500",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(59,130,246,0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 0 18px rgba(59,130,246,0.8)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "0 0 10px rgba(59,130,246,0.4)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
