import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AccountsDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [statements, setStatements] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [pendingReconciliations, setPendingReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Fetch invoices & financial summary
        const invoiceRes = await api.get("/reports/invoice-register");
        const creditRes = await api.get("/reports/credit-debit-notes");
        const outstandingRes = await api.get("/reports/outstanding-receivables");
        const dealerRes = await api.get("/dealers");

        // Summaries
        setSummary({
          invoices: invoiceRes.data.invoices?.length || 0,
          creditNotes: creditRes.data.totalCredit || 0,
          debitNotes: creditRes.data.totalDebit || 0,
          outstanding: outstandingRes.data.totalOutstanding || 0,
          totalDealers: dealerRes.data.total || 0,
        });

        // Financial performance over time
        const monthlyData = invoiceRes.data.invoices
          ?.slice(0, 10)
          .map((inv) => ({
            month: new Date(inv.invoiceDate).toLocaleString("default", { month: "short" }),
            total: inv.totalAmount,
            paid: inv.paidAmount,
          })) || [];
        setFinancialData(monthlyData);

        // Account statements
        const statementRes = await api.get("/reports/account-statement");
        setStatements(statementRes.data.statements || []);

        // Pending reconciliations (unpaid invoices)
        setPendingReconciliations(outstandingRes.data.invoices || []);
      } catch (err) {
        console.error("Error fetching accounts dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return <div className="center text-center" style={{ height: "80vh" }}>Loading accounts dashboard...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "2rem", color: "#60a5fa" }}>Accounts Dashboard</h2>
        <p style={{ color: "#94a3b8" }}>
          Manage invoices, financial statements, and ensure accurate reconciliation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid mt-4">
        <Card title="Total Invoices" value={summary.invoices} icon="🧾" onClick={() => navigate("/reports")} />
        <Card title="Total Credit Notes" value={`₹${summary.creditNotes}`} icon="📈" onClick={() => navigate("/reports")} />
        <Card title="Total Debit Notes" value={`₹${summary.debitNotes}`} icon="📉" onClick={() => navigate("/reports")} />
        <Card title="Outstanding (₹)" value={summary.outstanding} icon="💰" />
      </div>

      {/* Financial Performance Chart */}
      <div className="card mt-6">
        <h3>Financial Performance Overview</h3>
        {financialData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Invoices" />
              <Line type="monotone" dataKey="paid" stroke="#22c55e" name="Paid Amount" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No financial data available</p>
        )}
      </div>

      {/* Account Statements */}
      <div className="card mt-6">
        <h3>Recent Account Statements</h3>
        {statements.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Date</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {statements.slice(0, 5).map((stmt) => (
                <tr key={stmt.id}>
                  <td>{stmt.dealer?.businessName || "N/A"}</td>
                  <td>{new Date(stmt.statementDate).toLocaleDateString()}</td>
                  <td>{stmt.debitAmount}</td>
                  <td>{stmt.creditAmount}</td>
                  <td>{stmt.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#94a3b8" }}>No recent account statements</p>
        )}
      </div>

      {/* Pending Reconciliations */}
      <div className="card mt-6">
        <h3>Pending Reconciliation</h3>
        {pendingReconciliations.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Dealer</th>
                <th>Due Date</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {pendingReconciliations.slice(0, 5).map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.dealer?.businessName || "N/A"}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td>{inv.balanceAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#94a3b8" }}>All reconciliations are up-to-date!</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <button className="primary" onClick={() => navigate("/reports")}>
          📊 Generate Financial Reports
        </button>
        <button
          className="primary"
          onClick={() => navigate("/invoices")}
          style={{ background: "linear-gradient(90deg, #3b82f6, #2563eb)" }}
        >
          🧾 View Invoices
        </button>
        <button
          className="primary"
          onClick={() => navigate("/reports")}
          style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
        >
          💼 View Credit/Debit Notes
        </button>
      </div>
    </div>
  );
}

// Card Component
const Card = ({ title, value, icon, onClick }) => (
  <div className="card hover-glow" onClick={onClick}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4>{title}</h4>
    </div>
    <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#3b82f6" }}>{value}</p>
  </div>
);
