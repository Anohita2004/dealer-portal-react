import React, { useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DonutProgress from "../../components/DonutProgress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await api.get("/inventory");
        setInventory(res.data.inventory || []);
        setSummary(res.data.summary || {});
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleStockUpdate = async (id) => {
    if (!newStock || isNaN(newStock)) {
      alert("Enter a valid number for stock.");
      return;
    }
    try {
      await api.patch(`/inventory/${id}`, { stock: parseInt(newStock) });
      const res = await api.get("/inventory");
      setInventory(res.data.inventory || []);
      setSelectedProduct(null);
      setNewStock("");
    } catch (err) {
      console.error("Error updating stock:", err);
    }
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading inventory dashboard...
      </div>
    );
  if (error) return <p className="error">{error}</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* ✅ Header */}
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Monitor product stock, plant capacity, and reorder risks."
      />

      {/* ✅ Unified Toolbar */}
      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or plants..."
          />,
        ]}
        right={[
          <IconPillButton
            key="adjust"
            icon="📝"
            label="Bulk Adjust"
            tone="warning"
            onClick={() => {}}
          />,
          <IconPillButton
            key="export"
            icon="⬇️"
            label="Export"
            tone="success"
            onClick={() => {}}
          />,
        ]}
      />

      {/* ✅ 2-Column Modern Dashboard Layout */}
      <div
        className="dashboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "70% 30%",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* ✅ LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ✅ Main Chart */}
          <Card title="Stock Overview by Plant">
            {inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aggregateByPlant(inventory)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--card-border)"
                  />
                  <XAxis dataKey="plant" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-color)",
                    }}
                  />
                  <Bar
                    dataKey="totalStock"
                    fill="var(--accent)"
                    barSize={20}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#94a3b8" }}>No inventory data available</p>
            )}
          </Card>

          {/* ✅ Table */}
          <Card title="Product Inventory Details">
            <DataTable
              columns={[
                { key: "name", label: "Product" },
                { key: "plant", label: "Plant" },
                {
                  key: "stock",
                  label: "Stock",
                  render: (v) => (
                    <span
                      style={{
                        color: v < 10 ? "#ef4444" : "inherit",
                        fontWeight: v < 10 ? 700 : 400,
                      }}
                    >
                      {v}
                    </span>
                  ),
                },
                { key: "uom", label: "UOM" },
                { key: "lastUpdatedAt", label: "Last Updated" },
                { key: "action", label: "Action" },
              ]}
              rows={inventory
                .filter((item) => {
                  const q = search.toLowerCase();
                  const name = item?.name?.toString().toLowerCase() || "";
                  const plant = item?.plant?.toString().toLowerCase() || "";
                  return q === "" || name.includes(q) || plant.includes(q);
                })
                .map((item) => ({
                  id: item.id,
                  name: item.name || "—",
                  plant: item.plant || "—",
                  stock: item.stock ?? 0,
                  uom: item.uom || "—",
                  lastUpdatedAt: item.lastUpdatedAt
                    ? new Date(item.lastUpdatedAt).toLocaleDateString()
                    : "—",

                  action:
                    selectedProduct === item.id ? (
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          style={{ width: "70px" }}
                        />
                        <button className="primary" onClick={() => handleStockUpdate(item.id)}>
                          Save
                        </button>
                        <button
                          className="primary danger"
                          onClick={() => setSelectedProduct(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="primary"
                        onClick={() => setSelectedProduct(item.id)}
                      >
                        Update
                      </button>
                    ),
                }))}
              emptyMessage="No inventory records available."
            />
          </Card>
        </div>

        {/* ✅ RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ✅ KPI Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <StatCard
              title="Total Products"
              value={inventory.length}
              icon="📦"
            />
            <StatCard
              title="Active Plants"
              value={new Set(inventory.map((i) => i.plant)).size}
              icon="🏭"
            />
            <StatCard
              title="Low Stock Items"
              value={inventory.filter((i) => i.stock < 10).length}
              icon="⚠️"
            />
            <StatCard
              title="Total Stock"
              value={inventory.reduce((sum, i) => sum + i.stock, 0)}
              icon="📊"
            />
          </div>

          {/* ✅ Donut Cards */}
          <Card title="Low Stock Ratio">
            <DonutProgress
              value={inventory.filter((i) => i.stock < 10).length}
              total={inventory.length}
              label="Items below threshold"
            />
          </Card>

          <Card title="Plant Coverage">
            <DonutProgress
              value={new Set(inventory.map((i) => i.plant)).size}
              total={Math.max(new Set(inventory.map((i) => i.plant)).size, 1)}
              label="Active plants"
            />
          </Card>

          {/* ✅ Quick Actions */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <IconPillButton label="Bulk Adjust" icon="📝" tone="warning" />
            <IconPillButton label="Export" icon="⬇️" tone="success" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper: Aggregate stock by plant for the chart */
const aggregateByPlant = (data) => {
  const plantTotals = {};
  data.forEach((item) => {
    if (!plantTotals[item.plant]) plantTotals[item.plant] = 0;
    plantTotals[item.plant] += item.stock;
  });
  return Object.keys(plantTotals).map((plant) => ({
    plant,
    totalStock: plantTotals[plant],
  }));
};
