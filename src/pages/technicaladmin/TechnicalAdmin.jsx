import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import StatCard from "../../components/StatCard";

import { AuthContext } from "../../context/AuthContext";

import { ShieldCheck, ShieldAlert, Database, Save } from "lucide-react";

import "../dashboards/DashboardLayout.css"; // same layout styles

export default function TechnicalAdminDashboard() {
  const { user } = useContext(AuthContext);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [dirty, setDirty] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [r, p] = await Promise.all([
        api.get("/roles"),
        api.get("/permissions"),
      ]);

      setRoles(r.data);
      setPermissions(p.data);

      const m = {};
      r.data.forEach((role) => {
        m[role.id] = new Set(role.permissions?.map((p) => p.id) || []);
      });

      setMatrix(m);
      setDirty(new Set());
    } catch (e) {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (roleId, permId) => {
    setMatrix((prev) => {
      const updated = { ...prev };
      const set = new Set(updated[roleId]);

      set.has(permId) ? set.delete(permId) : set.add(permId);
      updated[roleId] = set;

      setDirty((dr) => new Set(dr).add(roleId));
      return updated;
    });
  };

  const saveRole = async (roleId) => {
    try {
      setSaving(true);
      const permissionIds = [...matrix[roleId]];
      await api.put(`/roles/${roleId}/permissions`, { permissionIds });

      toast.success("Permissions updated");

      setDirty((dr) => {
        const s = new Set(dr);
        s.delete(roleId);
        return s;
      });
    } catch {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "70vh" }}>
        Loading Technical Admin…
      </div>
    );

  return (
  <div className="dashboard-page">
    <div className="dashboard-container">

      <PageHeader
        title="Technical Admin Dashboard"
        subtitle="System-wide role and permission management"
      />

      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permissions…"
          />,
        ]}
        right={[
          <IconPillButton
            key="reload"
            icon={<Database size={18} />}
            label="Reload Data"
            onClick={load}
          />,
        ]}
      />

      <div className="stat-grid">
        <StatCard title="Total Roles" value={roles.length} icon={<ShieldCheck />} />
        <StatCard title="Total Permissions" value={permissions.length} icon={<ShieldAlert />} />
        <StatCard title="Roles Modified" value={dirty.size} icon={<Save />} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Role Permission Matrix">

            <div className="matrix-scroll">
              {/* your full table stays unchanged here */}
            </div>

          </Card>
        </div>

        <div className="column">
          <Card title="System Notes">
            <p className="text-muted small">
              ✓ Editing permissions takes effect immediately.<br />
              ✓ Avoid removing core permissions from Super Admin.<br />
              ✓ Technical Admin has full control.
            </p>
          </Card>

          <Card title="Recent Updates">
            <p className="text-muted small">No recent updates.</p>
          </Card>
        </div>
      </div>

    </div>
  </div>
);

}
