import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function UserForm({ onClose, reload, userData, roles }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    dealerId: "",
    regionId: "",
  });

  const [dealers, setDealers] = useState([]);
  const [regions, setRegions] = useState([]);

  const isEdit = !!userData;

  useEffect(() => {
    async function fetchDropdowns() {
      const d = await api.get("/dealers");
      const r = await api.get("/regions");

      setDealers(d.data);
      setRegions(r.data);
    }
    fetchDropdowns();

    if (isEdit) {
      setForm({
        username: userData.username,
        email: userData.email,
        password: "",
        roleId: userData.roleId,
        dealerId: userData.dealerId || "",
        regionId: userData.regionId || "",
      });
    }
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await api.put(`/admin/users/${userData.id}`, form);
      } else {
        await api.post("/admin/users", form);
      }

      reload();
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          width: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2>{isEdit ? "Edit User" : "Add User"}</h2>

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {!isEdit && (
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        )}

        {/* Roles */}
        <select
          value={form.roleId}
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* Dealers */}
        <select
          value={form.dealerId}
          onChange={(e) => setForm({ ...form, dealerId: e.target.value })}
        >
          <option value="">Assign Dealer (Optional)</option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.businessName}
            </option>
          ))}
        </select>

        {/* Regions */}
        <select
          value={form.regionId}
          onChange={(e) => setForm({ ...form, regionId: e.target.value })}
        >
          <option value="">Assign Region (Optional)</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          style={{
            padding: "0.8rem",
            background: "#f97316",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Save
        </button>

        <button
          onClick={onClose}
          type="button"
          style={{
            marginTop: "0.5rem",
            background: "transparent",
            border: "1px solid #aaa",
            padding: "0.6rem",
            borderRadius: "6px",
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
