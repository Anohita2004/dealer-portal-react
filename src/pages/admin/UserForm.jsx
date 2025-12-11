import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function UserForm({ onClose, reload, userData }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    dealerId: "",
  });

  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [dealers, setDealers] = useState([]);

  const isEdit = !!userData;

  const extract = (data) =>
    Array.isArray(data) ? data :
    Array.isArray(data?.data) ? data.data :
    data?.roles || data?.regions || data?.areas || data?.territories || data?.dealers || [];

  useEffect(() => {
    loadFormData();
    if (isEdit && userData) {
      setForm({
        username: userData.username ?? "",
        email: userData.email ?? "",
        password: "",
        role: (userData.role || "").toLowerCase(),
        regionId: userData.regionId ?? "",
        areaId: userData.areaId ?? "",
        territoryId: userData.territoryId ?? "",
        dealerId: userData.dealerId ?? "",
      });
    }
  }, [userData]);

  async function loadFormData() {
    try {
      const [r, rg, a, t, d] = await Promise.all([
        api.get("/roles"),
        api.get("/regions"),
        api.get("/areas"),
        api.get("/territories"),
        api.get("/dealers"),
      ]);

      setRoles(extract(r.data));
      setRegions(extract(rg.data));
      setAreas(extract(a.data));
      setTerritories(extract(t.data));
      setDealers(extract(d.data));

    } catch (err) {
      console.log("Dropdown fetch error →", err);
    }
  }

  // ROLE MAP — stable, fast & scalable
  const access = {
    super_admin       : [],
    regional_admin    : ["region"],
    sales_manager     : ["region","area"],
    area_manager      : ["region","area"],
    territory_manager : ["region","area","territory"],
    dealer_admin      : ["region","dealer"],
    dealer_staff      : ["region","area","territory","dealer"]
  };

  const allowed = access[form.role] || [];

  const showRegion    = allowed.includes("region");
  const showArea      = allowed.includes("area");
  const showTerritory = allowed.includes("territory");
  const showDealer    = allowed.includes("dealer");

  const filteredAreas       = areas.filter(a => !form.regionId || a.regionId === form.regionId);
  const filteredTerritories = territories.filter(t => !form.areaId || t.areaId === form.areaId);
  const filteredDealers     = dealers.filter(d =>
    (form.territoryId && d.territoryId === form.territoryId) ||
    (form.regionId && d.regionId === form.regionId)
  );

  function update(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "regionId") next.areaId = next.territoryId = next.dealerId = "";
      if (name === "areaId") next.territoryId = next.dealerId = "";
      if (name === "territoryId") next.dealerId = "";
      return next;
    });
  }

  async function saveUser(e) {
    e.preventDefault();

    const payload = { ...form, role: form.role };  // backend expects "role:string"
    if (!payload.password) delete payload.password;

    try {
      isEdit
        ? await api.put(`/admin/users/${userData.id}`, payload)
        : await api.post("/admin/users", payload);

      reload?.();
      onClose?.();
    } catch (err) {
      console.log(err);
      alert("User save failed — likely missing region/territory mapping");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <form onSubmit={saveUser}
        className="bg-white rounded-xl p-8 w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 space-y-4">
        
        <h2 className="text-2xl font-bold text-orange-500">
          {isEdit ? "Update User" : "Create New User"}
        </h2>

        <input className="border p-3 rounded" placeholder="Username" required
          value={form.username} onChange={e => update("username", e.target.value)} />

        <input className="border p-3 rounded" type="email" placeholder="Email" required
          value={form.email} onChange={e => update("email", e.target.value)} />

        {!isEdit && (
          <input className="border p-3 rounded" type="password" placeholder="Password" required
            value={form.password} onChange={e => update("password", e.target.value)} />
        )}

        <select className="border p-3 rounded" required
          value={form.role} onChange={(e) => update("role", e.target.value)}>
          <option value="">Select Role</option>
          {roles.map(r => (
            <option key={r.id} value={r.name.toLowerCase()}>{r.name}</option>
          ))}
        </select>

        {showRegion && (
          <select className="border p-3 rounded" value={form.regionId}
            onChange={(e) => update("regionId", e.target.value)} required>
            <option value="">Select Region</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}

        {showArea && (
          <select className="border p-3 rounded" value={form.areaId}
            onChange={(e) => update("areaId", e.target.value)} required>
            <option value="">Select Area</option>
            {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}

        {showTerritory && (
          <select className="border p-3 rounded" value={form.territoryId}
            onChange={(e) => update("territoryId", e.target.value)} required>
            <option value="">Select Territory</option>
            {filteredTerritories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        {showDealer && (
          <select className="border p-3 rounded" value={form.dealerId}
            onChange={(e) => update("dealerId", e.target.value)} required>
            <option value="">Select Dealer</option>
            {filteredDealers.map(d => <option key={d.id} value={d.id}>{d.businessName}</option>)}
          </select>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border bg-gray-100 py-2 rounded-lg">Cancel</button>
          <button type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg">Save</button>
        </div>

      </form>
    </div>
  );
}

