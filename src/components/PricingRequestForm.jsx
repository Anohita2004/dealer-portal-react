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
    <div style={{ padding: "var(--spacing-6)" }}>
      <h2 style={{ marginBottom: "var(--spacing-4)", color: "var(--color-text-primary)", fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-semibold)" }}>Request Pricing Change</h2>

      {/* Product Select */}
      <label style={{ display: "block", marginBottom: "var(--spacing-2)", color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>Product</label>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "var(--spacing-3) var(--spacing-4)", 
          marginBottom: "var(--spacing-4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-sm)",
          transition: "all var(--transition-base)"
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
      >
        <option value="">Select a product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Old Price */}
      <label style={{ display: "block", marginBottom: "var(--spacing-2)", color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>Current Price</label>
      <input
        type="text"
        value={oldPrice}
        disabled
        style={{ 
          width: "100%", 
          padding: "var(--spacing-3) var(--spacing-4)", 
          marginBottom: "var(--spacing-4)", 
          background: "var(--color-background)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-sm)"
        }}
      />

      {/* New Price */}
      <label style={{ display: "block", marginBottom: "var(--spacing-2)", color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>Requested New Price</label>
      <input
        type="number"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "var(--spacing-3) var(--spacing-4)", 
          marginBottom: "var(--spacing-4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-sm)",
          transition: "all var(--transition-base)"
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
      />

      {/* Reason */}
      <label style={{ display: "block", marginBottom: "var(--spacing-2)", color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>Reason</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        style={{ 
          width: "100%", 
          padding: "var(--spacing-3) var(--spacing-4)", 
          marginBottom: "var(--spacing-4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-family)",
          resize: "vertical",
          transition: "all var(--transition-base)"
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
      />

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-3)" }}>
        <button
          onClick={onClose}
          style={{ 
            padding: "var(--spacing-2) var(--spacing-3)", 
            background: "var(--color-background)", 
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--font-weight-medium)",
            transition: "all var(--transition-base)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary-soft)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-background)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Cancel
        </button>
        <button
          onClick={submitRequest}
          disabled={loading}
          style={{ 
            padding: "var(--spacing-2) var(--spacing-3)", 
            background: loading ? "var(--color-border)" : "var(--color-primary)", 
            color: "var(--color-surface)", 
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--font-weight-semibold)",
            transition: "all var(--transition-base)",
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "var(--color-primary-dark)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}