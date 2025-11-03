import React, { useState } from "react";
import api from "../services/api";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [type, setType] = useState("dealer-performance");

  const fetchReport = async () => {
    const res = await api.get(`/reports/${type}`);
    setReport(res.data);
  };

  return (
    <div>
      <h2>Reports</h2>
      <select onChange={e => setType(e.target.value)} value={type}>
        <option value="dealer-performance">Dealer Performance</option>
        <option value="outstanding-receivables">Outstanding Receivables</option>
        <option value="invoice-register">Invoice Register</option>
      </select>
      <button onClick={fetchReport}>Generate</button>

      {report && <pre>{JSON.stringify(report, null, 2)}</pre>}
    </div>
  );
}
