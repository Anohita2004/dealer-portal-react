import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

import PageHeader from "../../components/PageHeader";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  FileDown,
  FileSpreadsheet,
  Plus,
  Package,
  Factory,
  AlertTriangle,
  ListChecks,
} from "lucide-react";

export default function InventoryDashboard() {
  const { user } = useContext(AuthContext);

  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Themes per role
  const roleTheme = {
    dealer: { color: "#3b82f6", bg: "#eff6ff" },
    manager: { color: "#f59e0b", bg: "#fff7ed" },
    inventory: { color: "#22c55e", bg: "#f0fdf4" },
    admin: { color: "#8b5cf6", bg: "#f5f3ff" },
  };

  const theme = roleTheme[user?.role] || { color: "#6b7280", bg: "#f9fafb" };

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // FETCH inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/summary");
      setInventory(res.data.inventory || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Export
  const handleExport = async (format) => {
    try {
      const response = await api.get(`/inventory/export?format=${format}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inventory_${new Date().toISOString().slice(0, 10)}.${
          format === "pdf" ? "pdf" : "xlsx"
        }`
      );
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error("Export failed");
    }
  };

  // Add item
  const handleAddMockItem = async () => {
    try {
      const mock = {
        product: "New Product",
        available: Math.floor(Math.random() * 100),
        plant: "Chennai",
        reorderLevel: 10,
      };

      const res = await api.post("/inventory", mock);
      toast.success("Item added");
      setInventory((prev) => [...prev, res.data.item]);
    } catch (err) {
      toast.error("Failed to add item");
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Item deleted");
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  // Filter
  const filtered = inventory.filter((item) =>
    item.product.toLowerCase().includes(search.toLowerCase())
  );

  // Table Columns
  const columns = [
    { key: "product", label: "Product" },
    { key: "available", label: "Available" },

    (["manager", "inventory", "admin"].includes(user?.role)) && {
      key: "plant",
      label: "Plant",
    },

    (["inventory", "admin"].includes(user?.role)) && {
      key: "reorderLevel",
      label: "Reorder Level",
    },

    (["inventory", "admin"].includes(user?.role)) && {
      key: "updatedAt",
      label: "Last Updated",
    },

    (["inventory", "admin"].includes(user?.role)) && {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            border: "none",
            padding: "6px 10px",
            background: "#ef4444",
            color: "white",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      ),
    },
  ].filter(Boolean);

  // Derived Data
  const lowStockCount = inventory.filter(
    (i) => i.reorderLevel && i.available < i.reorderLevel
  ).length;

  const plantWiseData = Object.values(
    inventory.reduce((acc, cur) => {
      if (!cur.plant) return acc;
      acc[cur.plant] = acc[cur.plant] || { name: cur.plant, total: 0 };
      acc[cur.plant].total += cur.available;
      return acc;
    }, {})
  );

  return (
    <div style={{ padding: "1rem", background: theme.bg, minHeight: "100vh" }}>
      <PageHeader
        title="Inventory Dashboard"
        subtitle={`Live stock monitoring — role: ${user?.role?.toUpperCase()}`}
        actions={[
          (user?.role !== "dealer") && (
            <IconPillButton
              key="pdf"
              label="Export PDF"
              icon={<FileDown size={16} />}
              onClick={() => handleExport("pdf")}
            />
          ),
          (user?.role !== "dealer") && (
            <IconPillButton
              key="excel"
              label="Export Excel"
              icon={<FileSpreadsheet size={16} />}
              tone="success"
              onClick={() => handleExport("excel")}
            />
          ),
          (["inventory", "admin"].includes(user?.role)) && (
            <IconPillButton
              key="add"
              label="Add Item"
              icon={<Plus size={16} />}
              tone="warning"
              onClick={handleAddMockItem}
            />
          ),
        ].filter(Boolean)}
      />

      <div
        style={{
          background: theme.color,
          color: "white",
          padding: "0.6rem 1rem",
          borderRadius: 10,
          display: "inline-block",
          marginBottom: "1rem",
        }}
      >
        Logged in as <strong>{user?.role?.toUpperCase()}</strong>
      </div>

      <Toolbar>
        <SearchInput
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

      {/* Charts Section */}
      {!loading && inventory.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {/* Product Stock Levels */}
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ marginBottom: "1rem", color: "#111827" }}>
              <Package size={18} style={{ marginRight: 6 }} />
              Stock Levels by Product
            </h4>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventory}>
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="available" fill={theme.color} name="Available" />
                {(["inventory", "admin"].includes(user?.role)) && (
                  <Bar dataKey="reorderLevel" fill="#f97316" name="Reorder Level" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plant Distribution */}
          {user?.role !== "dealer" && (
            <div
              style={{
                background: "white",
                padding: "1rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <h4 style={{ marginBottom: "1rem", color: "#111827" }}>
                <Factory size={18} style={{ marginRight: 6 }} />
                Stock by Plant
              </h4>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={plantWiseData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {plantWiseData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ marginTop: "2rem" }}>
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Loading inventory...</p>
        ) : (
          <DataTable columns={columns} rows={filtered} />
        )}
      </div>

      {/* Summary Cards */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "1rem",
            borderRadius: "12px",
            flex: 1,
            minWidth: "220px",
          }}
        >
          <h4 style={{ color: theme.color, display: "flex", alignItems: "center", gap: 8 }}>
            <ListChecks size={18} /> Summary
          </h4>
          <p>Total Dealers: {summary.totalDealers}</p>
          <p>Active Campaigns: {summary.activeCampaigns}</p>
          <p>Total Invoices: {summary.totalInvoices}</p>
        </div>

        <div
          style={{
            background: lowStockCount > 0 ? "#fee2e2" : "#dcfce7",
            padding: "1rem",
            borderRadius: "12px",
            flex: 1,
            minWidth: "220px",
          }}
        >
          <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} /> Low Stock Items
          </h4>
          <p>
            {lowStockCount > 0
              ? `${lowStockCount} product(s) below reorder level`
              : "All stocks are healthy"}
          </p>
        </div>
      </div>
    </div>
  );
}
