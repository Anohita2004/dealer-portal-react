import React, { useEffect, useState } from "react";
import api from "../../services/api";
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
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "2rem", color: "#60a5fa" }}>Inventory Dashboard</h2>
        <p style={{ color: "#94a3b8" }}>
          Monitor stock across plants and ensure real-time SAP visibility.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid mt-4">
        <Card title="Total Products" value={inventory.length} icon="📦" />
        <Card title="Active Plants" value={new Set(inventory.map(i => i.plant)).size} icon="🏭" />
        <Card title="Low Stock Items" value={inventory.filter(i => i.stock < 10).length} icon="⚠️" />
        <Card title="Total Stock" value={inventory.reduce((sum, i) => sum + i.stock, 0)} icon="📊" />
      </div>

      {/* Inventory Chart */}
      <div className="card mt-6">
        <h3>Stock Overview by Plant</h3>
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
      </div>

      {/* Inventory Table */}
      <div className="card mt-6">
        <h3>Product Inventory Details</h3>
        {inventory.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Plant</th>
                <th>Stock</th>
                <th>UOM</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.plant}</td>
                  <td
                    style={{
                      color: item.stock < 10 ? "red" : "inherit",
                      fontWeight: item.stock < 10 ? "bold" : "normal",
                    }}
                  >
                    {item.stock}
                  </td>
                  <td>{item.uom}</td>
                  <td>{new Date(item.lastUpdatedAt).toLocaleDateString()}</td>
                  <td>
                    {selectedProduct === item.id ? (
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
                          style={{
                            background: "linear-gradient(90deg, #ef4444, #b91c1c)",
                            marginLeft: "0.5rem",
                          }}
                          onClick={() => setSelectedProduct(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="primary"
                        style={{
                          background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                        }}
                        onClick={() => setSelectedProduct(item.id)}
                      >
                        Update Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No inventory records available.</p>
        )}
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

/* Reusable summary card */
const Card = ({ title, value, icon }) => (
  <div className="card hover-glow">
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4>{title}</h4>
    </div>
    <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#3b82f6" }}>{value}</p>
  </div>
);
