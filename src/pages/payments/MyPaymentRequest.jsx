// src/pages/payments/MyPaymentRequests.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { format } from "date-fns";

const Badge = ({ status }) => {
  const color = status === "approved" ? "#16a34a" : status === "rejected" ? "#dc2626" : "#f59e0b";
  return <span style={{ padding: "6px 10px", borderRadius: 999, background: `${color}22`, color, fontWeight: 600 }}>{status}</span>;
};

export default function MyPaymentRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payment/mine");
      setRows(res.data.requests || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const canEdit = (r) => r.status === "pending";

  const downloadProof = (r) => {
    if (!r.proofUrl) return;
    window.open(r.proofUrl, "_blank");
  };

  return (
    <div>
      <h2>My Payment Requests</h2>
      {loading ? <p>Loading…</p> : null}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Invoice</th><th>Amount</th><th>Status</th><th>Stage</th><th>Proof</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.invoiceNumber || r.invoice?.invoiceNumber}</td>
              <td>{r.amount}</td>
              <td><Badge status={r.status} /></td>
              <td>{r.currentStage || r.approvalStage || "dealer_admin"}</td>
              <td>{r.proofUrl ? <button onClick={() => downloadProof(r)}>View</button> : "—"}</td>
              <td>
                {canEdit(r) && <button onClick={async () => {
                  // allow cancel/edit flow - example: cancel
                  if (!confirm("Cancel this request?")) return;
                  try {
                    await api.post(`/payment/${r.id}/cancel`);
                    setRows(rows.filter(x => x.id !== r.id));
                  } catch (e) { console.error(e); alert("Failed"); }
                }}>Cancel</button>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6}>No payment requests yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
