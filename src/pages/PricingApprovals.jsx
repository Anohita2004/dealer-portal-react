import React, { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import SearchInput from "../components/SearchInput";
import "./dashboards/DashboardLayout.css";

export default function PricingApprovals() {
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUpdates = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      q.set("page", pageToLoad);
      q.set("limit", limit);
      // Admin wants all updates; dealers pass mine=true from dealer UI
      const res = await api.get(`/pricing?${q.toString()}`);
      setUpdates(res.data.updates || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch pricing updates:", err);
      toast.error("Failed to load pricing requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates(page);
    // eslint-disable-next-line
  }, [page]);

  const applyAction = async (id, action) => {
    try {
      const confirm = window.confirm(`Are you sure you want to ${action} this pricing request?`);
      if (!confirm) return;

      const remarks = window.prompt("Optional remarks (enter to skip):", "");
      // call backend patch
      await api.patch(`/pricing/${id}`, { status: action, remarks });
      toast.success(`Request ${action}ed`);
      // update local list
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error("Approve/reject failed:", err);
      toast.error("Action failed");
    }
  };

  // client-side search + filter
  const visible = updates
    .filter((u) => (statusFilter === "all" ? true : u.status === statusFilter))
    .filter((u) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        String(u.id).includes(q) ||
        String(u.productId).includes(q) ||
        String(u.dealerName || "").toLowerCase().includes(q) ||
        String(u.requestedBy || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="dashboard-container">
      <PageHeader title="Pricing Approvals" subtitle="Review and approve pricing change requests." />

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by id, product, dealer, requester..." />
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6 }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-primary" onClick={() => fetchUpdates(1)}>Refresh</button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="center">Loading...</div>
        ) : visible.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Dealer</th>
                  <th>Old</th>
                  <th>New</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Requested At</th>
                  <th style={{ minWidth: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.product?.name || u.productId}</td>
                    <td>{u.dealer?.businessName || u.dealerName || "—"}</td>
                    <td>{u.oldPrice ?? "—"}</td>
                    <td>{u.newPrice}</td>
                    <td className={`status-${u.status}`}>{u.status}</td>
                    <td>{u.requestedBy}</td>
                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                    <td>
                      {u.status === "pending" ? (
                        <>
                          <button className="btn-success" onClick={() => applyAction(u.id, "approved")}>Approve</button>
                          <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => applyAction(u.id, "rejected")}>Reject</button>
                        </>
                      ) : (
                        <span className="text-muted small">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination basic */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div className="text-muted small">Total: {total}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <div style={{ padding: "6px 10px" }}>Page {page}</div>
                <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={updates.length < limit}>Next</button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted">No pricing requests found.</p>
        )}
      </Card>
    </div>
  );
}
