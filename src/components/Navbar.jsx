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
    <nav style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "#1976d2", color: "#fff" }}>
      <div>
        <strong>Dealer Portal</strong>
      </div>
      <div>
        {user && <span style={{ marginRight: "1rem" }}>Hi, {user.name || user.username}</span>}
        <button onClick={handleLogout} style={{ background: "#fff", color: "#1976d2", borderRadius: 4 }}>Logout</button>
      </div>
    </nav>
  );
}
