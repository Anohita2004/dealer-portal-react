import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function PricingRequestForm({ onClose }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [oldPrice, setOldPrice] = useState(0);
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Load all products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Failed to load products…", err);
      }
    };

    loadProducts();
  }, []);

  // When product changes, auto-load old price
  useEffect(() => {
    if (!productId) return;

    const p = products.find((x) => x.id === parseInt(productId));
    if (p) setOldPrice(p.price || 0);
  }, [productId, products]);

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!productId || !newPrice || !reason) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await api.post("/pricing", {
        productId,
        oldPrice,
        newPrice,
        reason,
      });

      toast.success("✅ Pricing request submitted");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 15 }}>Request Pricing Change</h2>

      {/* Product Select */}
      <label>Product</label>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      >
        <option value="">Select a product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Old Price */}
      <label>Current Price</label>
      <input
        type="text"
        value={oldPrice}
        disabled
        style={{ width: "100%", padding: 8, marginBottom: 10, background: "#f3f4f6" }}
      />

      {/* New Price */}
      <label>Requested New Price</label>
      <input
        type="number"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      {/* Reason */}
      <label>Reason</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        style={{ width: "100%", padding: 8, marginBottom: 15 }}
      />

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={onClose}
          style={{ padding: "8px 12px", background: "#e5e7eb", borderRadius: 6 }}
        >
          Cancel
        </button>
        <button
          onClick={submitRequest}
          disabled={loading}
          style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", borderRadius: 6 }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}