import React, { useEffect, useState } from "react";
import api from "../../services/api";
import UserForm from "./UserForm";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Load users + roles
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await api.get("/admin/users");
      const r = await api.get("/roles");

      setUsers(u.data);
      setRoles(r.data);
    } catch (err) {
      console.error("Failed loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  // DELETE USER
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = selectedRole ? u.role?.toLowerCase() === selectedRole : true;

    return matchSearch && matchRole;
  });

  if (loading) return <p>Loading users...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: "1rem" }}>Users</h1>
        <button
          onClick={() => {
            setEditUser(null);
            setModalOpen(true);
          }}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#f97316",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          + Add User
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            width: "300px",
          }}
        />

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: "0.6rem",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
          }}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name.toLowerCase()}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Dealer</th>
            <th>Region</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role || "—"}</td>
              <td>{u.dealer?.businessName || "—"}</td>
              <td>{u.region?.name || "—"}</td>

              <td style={{ textAlign: "right" }}>
                <button
                  onClick={() => {
                    setEditUser(u);
                    setModalOpen(true);
                  }}
                  style={{
                    marginRight: "10px",
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "0.4rem 0.8rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(u.id)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    padding: "0.4rem 0.8rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {modalOpen && (
        <UserForm
          onClose={() => setModalOpen(false)}
          reload={loadData}
          roles={roles}
          userData={editUser}
        />
      )}
    </div>
  );
}
