import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";
import "./DashboardLayout.css";
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

export default function InventoryDashboard() {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🎨 Colors for charts
  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // 📡 Fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/summary");
      setInventory(res.data.inventory);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

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
        `inventory_${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error("Export failed");
    }
  };

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

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Item deleted");
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const filtered = inventory.filter((item) =>
    item.product.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "id", label: "ID" },
    { key: "product", label: "Product" },
    { key: "available", label: "Available" },
    { key: "plant", label: "Plant" },
    { key: "reorderLevel", label: "Reorder Level" },
    { key: "updatedAt", label: "Last Updated" },
    user?.role === "inventory" || user?.role === "admin"
      ? {
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
        }
      : null,
  ].filter(Boolean);

  // 🧠 Derived chart data
  const lowStockCount = inventory.filter(
    (i) => i.available < i.reorderLevel
  ).length;

  const plantWiseData = Object.values(
    inventory.reduce((acc, cur) => {
      acc[cur.plant] = acc[cur.plant] || { name: cur.plant, total: 0 };
      acc[cur.plant].total += cur.available;
      return acc;
    }, {})
  );

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Manage, visualize, and monitor stock levels"
        actions={[
          <IconPillButton
            key="pdf"
            label="Export PDF"
            icon="📄"
            onClick={() => handleExport("pdf")}
          />,
          <IconPillButton
            key="excel"
            label="Export Excel"
            icon="📊"
            onClick={() => handleExport("excel")}
            tone="success"
          />,
          (user?.role === "inventory" || user?.role === "admin") && (
            <IconPillButton
              key="add"
              label="Add Mock Item"
              icon="➕"
              onClick={handleAddMockItem}
              tone="warning"
            />
          ),
        ]}
      />

      <Toolbar>
        <SearchInput
          placeholder="Search by product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

      {/* 💹 Charts Section */}
      {!loading && inventory.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ marginBottom: "1rem" }}>📦 Stock Levels by Product</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventory}>
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="available" fill="#3b82f6" name="Available Stock" />
                <Bar
                  dataKey="reorderLevel"
                  fill="#f97316"
                  name="Reorder Level"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ marginBottom: "1rem" }}>🏭 Stock by Plant</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plantWiseData}
                  dataKey="total"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {plantWiseData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 🧾 Data Table */}
      <div style={{ marginTop: "2rem" }}>
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Loading inventory...</p>
        ) : (
          <DataTable columns={columns} rows={filtered} />
        )}
      </div>

      {/* 🔔 Summary Section */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#f1f5f9",
            padding: "1rem",
            borderRadius: "12px",
            flex: 1,
            minWidth: "200px",
          }}
        >
          <h4>📊 Summary</h4>
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
            minWidth: "200px",
          }}
        >
          <h4>⚠️ Low Stock Items</h4>
          <p>
            {lowStockCount > 0
              ? `${lowStockCount} product(s) below reorder level`
              : "All stocks are healthy!"}
          </p>
        </div>
      </div>
    </div>
  );
}
