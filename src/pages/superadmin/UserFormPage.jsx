// src/pages/superadmin/UserFormPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

/**
 * UserFormPage.jsx
 * Master dynamic form for creating/updating users with hierarchy-based behavior.
 */

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API data
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [dealers, setDealers] = useState([]);

  // User form data
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    dealerId: "",
    isActive: true,
  });

  // User being edited
  const [editingUser, setEditingUser] = useState(null);

  // -------------------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [rolesRes, regionsRes, dealersRes] = await Promise.all([
          api.get("/roles"),
          api.get("/regions"),
          api.get("/dealers"),
        ]);

        setRoles(rolesRes.data || []);
        setRegions(regionsRes.data?.regions ?? []);
        setDealers(dealersRes.data?.dealers ?? []);

        // If editing, load the existing user
        if (isEdit) {
          const userRes = await api.get(`/admin/users/${id}`);
          const u = userRes.data;

          setEditingUser(u);

          setForm({
            username: u.username || "",
            email: u.email || "",
            password: "",
            roleId: u.roleId || "",
            regionId: u.regionId || "",
            areaId: u.areaId || "",
            territoryId: u.territoryId || "",
            dealerId: u.dealerId || "",
            isActive: u.isActive,
          });

          // Preload dependent dropdowns
          if (u.regionId) loadAreas(u.regionId);
          if (u.areaId) loadTerritories(u.areaId);
        }
      } catch (err) {
        console.error("UserFormPage load error:", err);
        alert("Failed to load form data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, isEdit]);

  // -------------------------------------------------------------
  // DYNAMIC LOADERS FOR AREA / TERRITORY
  // -------------------------------------------------------------
  const loadAreas = async (regionId) => {
    if (!regionId) return setAreas([]);
    try {
      const res = await api.get(`/areas?regionId=${regionId}`);
      setAreas(res.data?.areas ?? []);
    } catch (err) {
      console.error("Failed to load areas:", err);
    }
  };

  const loadTerritories = async (areaId) => {
    if (!areaId) return setTerritories([]);
    try {
      const res = await api.get(`/territories?areaId=${areaId}`);
      setTerritories(res.data?.territories ?? []);
    } catch (err) {
      console.error("Failed to load territories:", err);
    }
  };

  // -------------------------------------------------------------
  // ROLE-BASED FIELD VISIBILITY
  // -------------------------------------------------------------
  const currentRole = roles.find((r) => r.id === Number(form.roleId));
  const roleName = currentRole?.name || "";

  const showRegion =
    ["regional_admin", "regional_manager", "area_manager", "territory_manager"].includes(
      roleName
    );

  const showArea = ["area_manager", "territory_manager"].includes(roleName);

  const showTerritory = ["territory_manager"].includes(roleName);

  const showDealer = ["dealer_admin", "dealer_staff"].includes(roleName);

  // Dealer roles must NOT show region/area/territory
  if (showDealer) {
    form.regionId = "";
    form.areaId = "";
    form.territoryId = "";
  }

  // -------------------------------------------------------------
  // INPUT HANDLER
  // -------------------------------------------------------------
  const handleInput = async (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };

      // If role changes → clear all hierarchy fields
      if (name === "roleId") {
        updated.regionId = "";
        updated.areaId = "";
        updated.territoryId = "";
        updated.dealerId = "";
      }

      // If region changes → reset area & territory
      if (name === "regionId") {
        updated.areaId = "";
        updated.territoryId = "";
        loadAreas(value);
      }

      // If area changes → reset territory
      if (name === "areaId") {
        updated.territoryId = "";
        loadTerritories(value);
      }

      return updated;
    });
  };

  // -------------------------------------------------------------
  // SUBMIT HANDLER
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password || undefined,
        roleId: Number(form.roleId),

        regionId: showRegion ? form.regionId : null,
        areaId: showArea ? form.areaId : null,
        territoryId: showTerritory ? form.territoryId : null,
        dealerId: showDealer ? form.dealerId : null,

        isActive: form.isActive,
      };

      if (isEdit) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await api.post(`/admin/users`, payload);
      }

      navigate("/dashboard/users");
    } catch (err) {
      console.error("Save user failed:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to save user.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading user form...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="max-w-4xl mx-auto bg-white border rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard/users")}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to Users
          </button>

          <h1 className="text-2xl font-semibold mt-2">
            {isEdit ? "Edit User" : "Create User"}
          </h1>
          <p className="text-sm text-slate-500">
            Assign hierarchy fields based on user role.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleInput}
              required
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleInput}
              required
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          {/* Password only on create */}
          {!isEdit && (
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleInput}
                required
                className="border px-3 py-2 rounded w-full"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select
              name="roleId"
              value={form.roleId}
              onChange={handleInput}
              required
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          {showRegion && (
            <div>
              <label className="block text-sm mb-1">Region</label>
              <select
                name="regionId"
                value={form.regionId}
                onChange={handleInput}
                required
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Area */}
          {showArea && (
            <div>
              <label className="block text-sm mb-1">Area</label>
              <select
                name="areaId"
                value={form.areaId}
                onChange={handleInput}
                required
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Territory */}
          {showTerritory && (
            <div>
              <label className="block text-sm mb-1">Territory</label>
              <select
                name="territoryId"
                value={form.territoryId}
                onChange={handleInput}
                required
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select territory</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dealer (for dealer_admin / staff) */}
          {showDealer && (
            <div>
              <label className="block text-sm mb-1">Dealer</label>
              <select
                name="dealerId"
                value={form.dealerId}
                onChange={handleInput}
                required
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select dealer</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.businessName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleInput}
            />
            <label className="text-sm">Active</label>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/users")}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded"
            >
              {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
