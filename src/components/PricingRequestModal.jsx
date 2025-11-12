import React, { useState, useEffect } from "react";
import api from "../services/api";
//import "./Modal.css"; // optional styling

export default function PricingRequestModal({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const res = await api.get("/products");
          setProducts(res.data.products || res.data);
        } catch (e) {
          console.error("Failed to fetch products", e);
        }
      })();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!productId || !newPrice) {
      alert("Please select a product and enter new price");
      return;
    }

    setLoading(true);
    try {
      const selected = products.find((p) => p.id === Number(productId));
      await api.post("/pricing/request", {
        productId,
        oldPrice: selected?.price,
        newPrice,
        reason,
      });
      alert("✅ Pricing request submitted successfully!");
      onClose();
    } catch (e) {
      console.error(e);
      alert("❌ Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Request Price Change</h2>

        <label>Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{p.price}
            </option>
          ))}
        </select>

        <label>New Price</label>
        <input
          type="number"
          placeholder="Enter new price"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
        />

        <label>Reason</label>
        <textarea
          placeholder="Explain reason for price change..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={loading} className="btn-success">
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button onClick={onClose} className="btn-danger">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
