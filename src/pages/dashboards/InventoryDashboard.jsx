import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function InventoryDashboard() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get("/inventory/stock-summary");
      setStock(res.data.stock || []);
    })();
  }, []);

  return (
    <div>
      <h2>Inventory Dashboard</h2>
      <table border="1" cellPadding="8">
        <thead><tr><th>Product</th><th>Plant</th><th>Available Qty</th></tr></thead>
        <tbody>
          {stock.map(s => (
            <tr key={s.id}><td>{s.productName}</td><td>{s.plant}</td><td>{s.quantity}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
