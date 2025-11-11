// ==============================
// FILE: src/pages/admin/AdminPricing.jsx
// ✅ Full Admin Pricing Approval Panel
// ==============================

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Card from "../../components/Card";
import IconPillButton from "../../components/IconPillButton";
import SearchInput from "../../components/SearchInput";
import Toolbar from "../../components/Toolbar";
import "./AdminDashboard.css";

export default function AdminPricing() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  // Load all pricing requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pricing", { params: { all: true } });
      setRequests(res.data.updates || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Approve
  const approve = async (id) => {
    try {
      await api.put(`/pricing/${id}/approve`);
      toast.success("✅ Request Approved");
      loadRequests();
    } catch (err) {
      toast.error("Failed to approve");
    }
  };

  // Reject
  const reject = async (id) => {
    const remarks = prompt("Enter rejection reason:");
    if (!remarks) return toast.error("Remarks required");

    try {
      await api.put(`/pricing/${id}/reject`, { remarks });
      toast.info("❌ Request Rejected");
      loadRequests();
    } catch (err) {
      toast.error("Failed to reject");
    }
  };

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !String(r.productId).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Pricing Approvals</h1>
      </header>

      {/* Toolbar */}
      <Toolbar
        left={[
          <SearchInput
            key="search"
            placeholder="Search by Product ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />,
        ]}
        right={[
          <IconPillButton icon="🔄" label="Refresh" onClick={loadRequests} />,
        ]}
      />

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, margin: "15px 0" }}>
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 12px",
              background: filter === s ? "#3b82f6" : "#e5e7eb",
              color: filter === s ? "#fff" : "#111",
              borderRadius: 6,
              border: "none",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <Card title="Pricing Requests Queue">
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Old</th>
                <th>New</th>
                <th>Dealer</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.productId}</td>
                  <td>{r.oldPrice ?? "—"}</td>
                  <td>{r.newPrice}</td>
                  <td>{r.dealerName}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === "pending" && (
                      <>
                        <button
                          style={{ marginRight: 10, background: "#10b981", padding: "5px 8px", borderRadius: 5, color: "#fff" }}
                          onClick={() => approve(r.id)}
                        >
                          Approve
                        </button>

                        <button
                          style={{ background: "#ef4444", padding: "5px 8px", borderRadius: 5, color: "#fff" }}
                          onClick={() => reject(r.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No requests found.</p>
        )}
      </Card>
    </div>
  );
}