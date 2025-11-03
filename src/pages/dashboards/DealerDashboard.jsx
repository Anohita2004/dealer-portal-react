import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function DealerDashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dealer performance summary
        const summaryRes = await api.get("/reports/dealer-performance");
        setSummary(summaryRes.data);

        // Dealer invoices
        const invoiceRes = await api.get("/invoices");
        setInvoices(invoiceRes.data.invoices || invoiceRes.data);
      } catch (err) {
        console.error("Error loading dealer dashboard:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Dealer Dashboard</h2>
      <div className="grid">
        <div className="card">
          <h4>Total Sales</h4>
          <p>₹{summary.totalSales || 0}</p>
        </div>
        <div className="card">
          <h4>Total Invoices</h4>
          <p>{summary.totalInvoices || 0}</p>
        </div>
      </div>

      <h3 style={{ marginTop: "2rem" }}>Recent Invoices</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {invoices.slice(0, 5).map((i) => (
            <tr key={i.id}>
              <td>{i.invoiceNumber}</td>
              <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
              <td>₹{i.totalAmount}</td>
              <td>{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
