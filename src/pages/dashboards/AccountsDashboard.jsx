import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DonutProgress from "../../components/DonutProgress";
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
  const [search, setSearch] = useState("");

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
      <PageHeader
        title="Accounts Dashboard"
        subtitle="Manage invoices, financial statements, and ensure accurate reconciliation."
      />

      <Toolbar
        right={[
          <IconPillButton key="new" icon="➕" label="New" tone="primary" onClick={() => navigate("/invoices")} />,
          <IconPillButton key="export" icon="⬇️" label="Export" tone="success" onClick={() => navigate("/reports")} />,
        ]}
      >
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices, dealers..." />
      </Toolbar>

      <div className="grid mt-4">
        <StatCard title="Total Invoices" value={summary.invoices} icon="🧾" accent="#f97316" />
        <StatCard title="Total Credit Notes" value={`₹${summary.creditNotes}`} icon="📈" accent="#22c55e" />
        <StatCard title="Total Debit Notes" value={`₹${summary.debitNotes}`} icon="📉" accent="#ef4444" />
        <StatCard title="Outstanding (₹)" value={summary.outstanding} icon="💰" accent="#a78bfa" />
      </div>

      <Card title="Financial Performance Overview" style={{ marginTop: "1.5rem" }}>
        {financialData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#f97316" name="Total Invoices" />
              <Line type="monotone" dataKey="paid" stroke="#22c55e" name="Paid Amount" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No financial data available</p>
        )}
      </Card>

      <div className="grid mt-6">
        <Card title="Outstanding Ratio">
          <DonutProgress
            value={financialData.reduce((s, d) => s + (d.total - d.paid), 0)}
            total={financialData.reduce((s, d) => s + d.total, 0)}
            colors={["#ef4444", "#1f2937"]}
            label="Outstanding vs Total"
          />
        </Card>
        <Card title="Paid Ratio">
          <DonutProgress
            value={financialData.reduce((s, d) => s + d.paid, 0)}
            total={financialData.reduce((s, d) => s + d.total, 0)}
            colors={["#22c55e", "#1f2937"]}
            label="Paid vs Total"
          />
        </Card>
      </div>

      <Card title="Recent Account Statements" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={[
            { key: "dealer", label: "Dealer" },
            { key: "date", label: "Date" },
            { key: "debitAmount", label: "Debit" },
            { key: "creditAmount", label: "Credit" },
            { key: "balance", label: "Balance" },
          ]}
          rows={statements.slice(0, 5).map((stmt) => ({
            id: stmt.id,
            dealer: stmt.dealer?.businessName || "N/A",
            date: new Date(stmt.statementDate).toLocaleDateString(),
            debitAmount: stmt.debitAmount,
            creditAmount: stmt.creditAmount,
            balance: stmt.balance,
          }))}
          emptyMessage="No recent account statements"
        />
      </Card>

      <Card title="Pending Reconciliation" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={[
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "dealer", label: "Dealer" },
            { key: "dueDate", label: "Due Date" },
            { key: "balanceAmount", label: "Balance" },
          ]}
          rows={pendingReconciliations.slice(0, 5).map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            dealer: inv.dealer?.businessName || "N/A",
            dueDate: new Date(inv.dueDate).toLocaleDateString(),
            balanceAmount: inv.balanceAmount,
          }))}
          emptyMessage="All reconciliations are up-to-date!"
        />
      </Card>

      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <button className="primary" onClick={() => navigate("/reports")}>
          📊 Generate Financial Reports
        </button>
        <button
          className="primary"
          onClick={() => navigate("/invoices")}
          style={{ background: "linear-gradient(90deg, #f97316, #ea580c)" }}
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

// (Stat cards moved to shared component)
