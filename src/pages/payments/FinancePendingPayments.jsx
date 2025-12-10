// src/pages/payments/FinancePendingPayments.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function FinancePendingPayments({ currentUserStage = "finance_admin" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payment/pending");
      setRows(res.data.requests || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/payment/${id}/${action}`, { remarks: remarks[id] || "" });
      toast.success(`${action}ed`);
      setRows(rows.filter(r => r.id !== id));
    } catch (e) { console.error(e); toast.error("Failed"); }
  };

  const reconcile = async () => {
    try {
      await api.post("/payment/reconcile/trigger");
      toast.success("Reconcile triggered");
      load();
    } catch (e) { console.error(e); toast.error("Failed"); }
  };

  return (
    <div>
      <h2>Finance — Pending Payments</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={reconcile}>Trigger Auto-Reconcile</button>
      </div>
      <table style={{ width: "100%" }}>
        <thead><tr><th>Invoice</th><th>Dealer</th><th>Amount</th><th>Proof</th><th>Remarks</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.invoiceNumber}</td>
              <td>{r.dealerName}</td>
              <td>{r.amount}</td>
              <td>{r.proofUrl ? <a href={r.proofUrl} target="_blank" rel="noreferrer">View</a> : "—"}</td>
              <td><input value={remarks[r.id] || ""} onChange={(e) => setRemarks({ ...remarks, [r.id]: e.target.value })} placeholder="remarks" /></td>
              <td>
                {r.currentStage === currentUserStage ? (
                  <>
                    <button onClick={() => act(r.id, "approve")}>Approve</button>
                    <button onClick={() => act(r.id, "reject")}>Reject</button>
                  </>
                ) : "Not your stage"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6}>No pending payments</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
