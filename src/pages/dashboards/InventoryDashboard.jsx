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
      alert("Stock updated successfully!");
      const res = await api.get("/inventory");
      setInventory(res.data.inventory || []);
      setSelectedProduct(null);
      setNewStock("");
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Failed to update stock.");
    }
  };

  if (loading)
    return <div className="center text-center" style={{ height: "80vh" }}>Loading inventory dashboard...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Monitor stock across plants and ensure real-time SAP visibility."
      />

      <Toolbar
        right={[
          <IconPillButton key="adjust" icon="📝" label="Bulk Adjust" tone="warning" onClick={() => {}} />,
          <IconPillButton key="export" icon="⬇️" label="Export" tone="success" onClick={() => {}} />,
        ]}
      >
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or plants..." />
      </Toolbar>

      <div className="grid mt-4">
        <StatCard title="Total Products" value={inventory.length} icon="📦" accent="#3b82f6" />
        <StatCard title="Active Plants" value={new Set(inventory.map(i => i.plant)).size} icon="🏭" accent="#22c55e" />
        <StatCard title="Low Stock Items" value={inventory.filter(i => i.stock < 10).length} icon="⚠️" accent="#ef4444" />
        <StatCard title="Total Stock" value={inventory.reduce((sum, i) => sum + i.stock, 0)} icon="📊" accent="#a78bfa" />
      </div>

      <Card title="Stock Overview by Plant" style={{ marginTop: "1.5rem" }}>
        {inventory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregateByPlant(inventory)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="plant" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="totalStock" fill="#3b82f6" name="Total Stock" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No inventory data available</p>
        )}
      </Card>

      <Card title="Product Inventory Details" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={[
            { key: "name", label: "Product" },
            { key: "plant", label: "Plant" },
            { key: "stock", label: "Stock", render: (v) => (
              <span style={{ color: v < 10 ? "#ef4444" : "inherit", fontWeight: v < 10 ? 700 : 400 }}>{v}</span>
            ) },
            { key: "uom", label: "UOM" },
            { key: "lastUpdatedAt", label: "Last Updated" },
            { key: "action", label: "Action" },
          ]}
          rows={inventory
            .filter((item) => {
              const q = search.toLowerCase();
              return !q || item.name?.toLowerCase().includes(q) || item.plant?.toLowerCase().includes(q);
            })
            .map((item) => ({
            id: item.id,
            name: item.name,
            plant: item.plant,
            stock: item.stock,
            uom: item.uom,
            lastUpdatedAt: new Date(item.lastUpdatedAt).toLocaleDateString(),
            action: selectedProduct === item.id ? (
              <div>
                <input
                  type="number"
                  placeholder="New stock"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  style={{ width: "70px", marginRight: "0.5rem" }}
                />
                <button
                  className="primary"
                  style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
                  onClick={() => handleStockUpdate(item.id)}
                >
                  Save
                </button>
                <button
                  className="primary"
                  style={{ background: "linear-gradient(90deg, #ef4444, #b91c1c)", marginLeft: "0.5rem" }}
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="primary"
                style={{ background: "linear-gradient(90deg, #3b82f6, #2563eb)" }}
                onClick={() => setSelectedProduct(item.id)}
              >
                Update Stock
              </button>
            ),
          }))}
          emptyMessage="No inventory records available."
        />
      </Card>

      <div className="grid mt-6">
        <Card title="Low Stock Ratio">
          <DonutProgress
            value={inventory.filter((i) => i.stock < 10).length}
            total={inventory.length}
            colors={["#ef4444", "#1f2937"]}
            label="Items below threshold"
          />
        </Card>
        <Card title="Plant Coverage">
          <DonutProgress
            value={new Set(inventory.map(i => i.plant)).size}
            total={Math.max(new Set(inventory.map(i => i.plant)).size, 1)}
            colors={["#22c55e", "#1f2937"]}
            label="Active plants"
          />
        </Card>
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

/* (legacy local Card removed in favor of shared component) */
