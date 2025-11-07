import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AccountsDashboard() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState({});
  const [statements, setStatements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🎨 Role color theme
  const roleTheme = {
    dealer: { color: "#3b82f6", bg: "#eff6ff" },
    manager: { color: "#f59e0b", bg: "#fff7ed" },
    accounts: { color: "#22c55e", bg: "#f0fdf4" },
    admin: { color: "#8b5cf6", bg: "#f5f3ff" },
  };
  const theme = roleTheme[user?.role] || { color: "#6b7280", bg: "#f9fafb" };
  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // 📡 Fetch accounts data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, stmtRes, invRes, recRes] = await Promise.all([
        api.get("/accounts/summary"),
        api.get("/accounts/statements"),
        api.get("/accounts/invoices"),
        api.get("/accounts/reconciliation"),
      ]);

      setSummary(summaryRes.data || {});
      setStatements(stmtRes.data?.statements || []);
      setInvoices(invRes.data?.invoices || []);
      setReconciliation(recRes.data?.pending || []);
    } catch (err) {
      toast.error("Failed to load accounts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 Filter search
  const filtered = statements.filter((item) =>
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  // 📊 Chart Data
  const barData =
    invoices.map((inv) => ({
      month: new Date(inv.invoiceDate).toLocaleString("default", { month: "short" }),
      total: inv.totalAmount,
      paid: inv.paidAmount,
    })) || [];

  const pieData = [
    { name: "Paid", value: invoices.reduce((s, i) => s + i.paidAmount, 0) },
    {
      name: "Outstanding",
      value: invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0),
    },
  ];

  // 💾 Export as Excel or PDF
  const handleExport = async (format) => {
    try {
      const response = await api.get(`/accounts/export?format=${format}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `accounts_${new Date().toISOString().slice(0, 10)}.${format}`
      );
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error("Export failed");
    }
  };

  // 🧱 Table Columns
  const columns = [
    { key: "date", label: "Date" },
    { key: "documentNumber", label: "Doc #" },
    { key: "debitAmount", label: "Debit" },
    { key: "creditAmount", label: "Credit" },
    { key: "balance", label: "Balance" },
  ];

  return (
    <div style={{ padding: "1rem", background: theme.bg, minHeight: "100vh" }}>
      <PageHeader
        title="Accounts Dashboard"
        subtitle={`Financial insights — role: ${user?.role?.toUpperCase()}`}
        actions={[
          (user?.role !== "dealer") && (
            <IconPillButton
              key="pdf"
              label="Export PDF"
              icon="📄"
              onClick={() => handleExport("pdf")}
            />
          ),
          (user?.role !== "dealer") && (
            <IconPillButton
              key="excel"
              label="Export Excel"
              icon="📊"
              onClick={() => handleExport("xlsx")}
              tone="success"
            />
          ),
        ].filter(Boolean)}
      />

      <div
        style={{
          background: theme.color,
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "10px",
          display: "inline-block",
          marginBottom: "1rem",
        }}
      >
        Logged in as <strong>{user?.role?.toUpperCase()}</strong>
      </div>

      <Toolbar>
        <SearchInput
          placeholder="Search by description or doc number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

      {/* 🔹 Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginTop: "1.2rem",
        }}
      >
        <div className="card">
          🧾 <b>{summary.totalInvoices || 0}</b> Invoices
        </div>
        <div className="card">
          📈 ₹{summary.totalCredit || 0} Credit Notes
        </div>
        <div className="card">
          📉 ₹{summary.totalDebit || 0} Debit Notes
        </div>
        <div className="card">
          💰 ₹{summary.totalOutstanding || 0} Outstanding
        </div>
      </div>

      {/* 📊 Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "1rem",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ color: "#111827", marginBottom: "1rem" }}>
            📆 Monthly Invoice Trends
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill={theme.color} name="Total Invoices" />
              <Bar dataKey="paid" fill="#22c55e" name="Paid Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: "white",
            padding: "1rem",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ color: "#111827", marginBottom: "1rem" }}>
            💼 Payment Distribution
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🧾 Account Statements Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginTop: "2rem",
          padding: "1rem",
        }}
      >
        <h4 style={{ color: "#111827", marginBottom: "1rem" }}>
          📋 Recent Account Statements
        </h4>
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Loading statements...</p>
        ) : (
          <DataTable columns={columns} rows={filtered.slice(0, 8)} />
        )}
      </div>

      {/* 🔸 Reconciliation Section */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: reconciliation.length ? "#fee2e2" : "#dcfce7",
            padding: "1rem",
            borderRadius: "12px",
            flex: 1,
            minWidth: "220px",
          }}
        >
          <h4>🔁 Reconciliation Status</h4>
          <p>
            {reconciliation.length
              ? `${reconciliation.length} invoice(s) pending reconciliation`
              : "All accounts are reconciled ✅"}
          </p>
        </div>
      </div>
    </div>
  );
}
