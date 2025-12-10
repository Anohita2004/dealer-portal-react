// src/pages/payments/DealerAdminPayments.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

const Badge = ({ status }) => {
  const color = status === "approved" ? "#16a34a" : status === "rejected" ? "#dc2626" : "#f59e0b";
  return <span style={{ padding: "6px 10px", borderRadius: 8, background: `${color}22`, color }}>{status}</span>;
};

export default function DealerAdminPayments({ currentUserStage = "dealer_admin" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarksFor, setRemarksFor] = useState({}); // {id: text}

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payment/dealer/pending");
      setRows(res.data.requests || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      const payload = { remarks: remarksFor[id] || "" };
      await api.post(`/payment/dealer/${id}/${action}`, payload);
      toast.success(`${action}ed`);
      setRows(rows.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Action failed");
    }
  };

  const viewProof = (r) => { if (r.proofUrl) window.open(r.proofUrl, "_blank"); };

  return (
    <div>
      <h2>Dealer Admin — Pending Payment Requests</h2>
      {loading ? <p>Loading…</p> : null}
      <table style={{ width: "100%" }}>
        <thead><tr><th>Invoice</th><th>Dealer</th><th>Amount</th><th>Proof</th><th>Remarks</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.invoiceNumber || r.invoice?.invoiceNumber}</td>
              <td>{r.dealerName || r.dealer?.name}</td>
              <td>{r.amount}</td>
              <td>{r.proofUrl ? <button onClick={() => viewProof(r)}>View</button> : "—"}</td>
              <td>
                <input value={remarksFor[r.id] || ""} onChange={(e) => setRemarksFor({ ...remarksFor, [r.id]: e.target.value })} placeholder="Optional remarks" />
              </td>
              <td>
                {r.currentStage === currentUserStage ? (
                  <>
                    <button onClick={() => act(r.id, "approve")}>Approve</button>
                    <button onClick={() => act(r.id, "reject")}>Reject</button>
                  </>
                ) : <div>Not your stage</div>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6}>No pending requests</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
