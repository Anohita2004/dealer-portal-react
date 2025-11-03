import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function AccountsDashboard() {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    (async () => {
      const res = await api.get("/reports/accounts-summary");
      setSummary(res.data);
    })();
  }, []);

  return (
    <div>
      <h2>Accounts Dashboard</h2>
      <div className="grid">
        <div className="card"><h4>Invoices</h4><p>{summary.totalInvoices || 0}</p></div>
        <div className="card"><h4>Credit Notes</h4><p>{summary.creditNotes || 0}</p></div>
        <div className="card"><h4>Outstanding</h4><p>₹{summary.outstanding || 0}</p></div>
      </div>
    </div>
  );
}
