import React, { useEffect, useState, useContext } from "react";
import api, { paymentAPI, reportAPI } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { isAccountsUser, getAccountsUserScopeExplanation } from "../../utils/accountsPermissions";

import PageHeader from "../../components/PageHeader";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import DataTable from "../../components/DataTable";

import { toast } from "react-toastify";
import {
  BarChart3,
  FileText,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Alert, Box, Chip, Button, Typography, Collapse } from "@mui/material";

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
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [statements, setStatements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [scopeExplanationOpen, setScopeExplanationOpen] = useState(false);

  // Role-Based Color Themes
  const roleTheme = {
    dealer: { color: "#3b82f6", bg: "#eff6ff" },
    manager: { color: "#f59e0b", bg: "#fff7ed" },
    accounts: { color: "#22c55e", bg: "#f0fdf4" },
    admin: { color: "#8b5cf6", bg: "#f5f3ff" },
  };

  const theme = roleTheme[user?.role] || { color: "#6b7280", bg: "#f9fafb" };
  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];


  // Helper to handle API errors gracefully (403/404 are expected for permission issues)
  const handleApiError = (err, defaultValue = []) => {
    // 403 Forbidden and 404 Not Found are expected for permission/endpoint issues
    if (err?.response?.status === 403 || err?.response?.status === 404) {
      return defaultValue;
    }
    // Log unexpected errors but don't throw
    if (err?.response?.status !== 403 && err?.response?.status !== 404) {
      console.debug("API call failed (non-permission error):", err);
    }
    return defaultValue;
  };

  // Fetch All Accounts Data - ONLY APIs that exist and Accounts role can access
  const fetchData = async () => {
    try {
      setLoading(true);

      // Core accounts APIs (these should exist for accounts users)
      const [summaryRes, stmtRes, invRes, recRes] = await Promise.all([
        api.get("/accounts/summary").catch((err) => {
          // 403/404 = not permitted or doesn't exist - return empty
          if (err?.response?.status === 403 || err?.response?.status === 404) {
            return { data: {} };
          }
          console.debug("Accounts summary API error:", err);
          return { data: {} };
        }),
        api.get("/accounts/statements").catch((err) => {
          if (err?.response?.status === 403 || err?.response?.status === 404) {
            return { data: { statements: [] } };
          }
          console.debug("Accounts statements API error:", err);
          return { data: { statements: [] } };
        }),
        api.get("/accounts/invoices").catch((err) => {
          if (err?.response?.status === 403 || err?.response?.status === 404) {
            return { data: { invoices: [] } };
          }
          console.debug("Accounts invoices API error:", err);
          return { data: { invoices: [] } };
        }),
        api.get("/accounts/reconciliation").catch((err) => {
          if (err?.response?.status === 403 || err?.response?.status === 404) {
            return { data: { pending: [] } };
          }
          console.debug("Accounts reconciliation API error:", err);
          return { data: { pending: [] } };
        }),
      ]);

      setSummary(summaryRes.data || {});
      setStatements(stmtRes.data?.statements || []);
      setInvoices(invRes.data?.invoices || []);
      setReconciliation(recRes.data?.pending || []);

      // Payment approvals - ONLY if accounts_user is allowed (may be finance_admin only)
      // Try to fetch, but don't fail if 403
      try {
        const pendingRes = await paymentAPI.getFinancePending();
        const paymentsList = pendingRes.payments || pendingRes.data || pendingRes || [];
        setPendingPayments(Array.isArray(paymentsList) ? paymentsList : []);
      } catch (err) {
        // 403 = not permitted for accounts_user (finance_admin only)
        // 404 = endpoint doesn't exist
        // Silently handle - Accounts may not have access to this
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          setPendingPayments([]);
        } else {
          console.debug("Payment approvals API error:", err);
          setPendingPayments([]);
        }
      }

      // Outstanding invoices - ONLY if report API is permitted for accounts
      // This returns 403, so hide this widget for accounts users
      setOutstandingInvoices([]);

      // Overdue payments - endpoint doesn't support status filter (404)
      // Don't try to fetch - hide this widget
      setOverduePayments([]);

    } catch (err) {
      // Only show toast for unexpected errors (not 403/404)
      if (err?.response?.status !== 403 && err?.response?.status !== 404) {
        console.error("Failed to load accounts data:", err);
        toast.error("Failed to load some accounts data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // Filter Search (Statements)
  const filtered = statements.filter((item) =>
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Chart Data Processing
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

  // Export Account Data
  const handleExport = async (format) => {
    try {
      const response = await api.get(`/accounts/export?format=${format}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
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


  // Data Table Columns
  const columns = [
    { key: "date", label: "Date" },
    { key: "documentNumber", label: "Document #" },
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
          user?.role !== "dealer" && (
            <IconPillButton
              key="pdf"
              label="Export PDF"
              icon={<Download size={18} />}
              onClick={() => handleExport("pdf")}
            />
          ),
          user?.role !== "dealer" && (
            <IconPillButton
              key="excel"
              label="Export Excel"
              icon={<Download size={18} />}
              tone="success"
              onClick={() => handleExport("xlsx")}
            />
          ),
        ].filter(Boolean)}
      />

      {/* Accounts User Scope Explanation */}
      {isAccountsUser(user) && (() => {
        const scopeInfo = getAccountsUserScopeExplanation(user);
        if (!scopeInfo) return null;
        
        return (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  setScopeExplanationOpen(!scopeExplanationOpen);
                }}
              >
                {scopeExplanationOpen ? "Hide" : "Show"} Details
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {scopeInfo.title}
            </Typography>
            <Typography variant="body2" sx={{ mb: scopeExplanationOpen ? 1 : 0 }}>
              {scopeInfo.description}
            </Typography>
            <Collapse in={scopeExplanationOpen}>
              <Box sx={{ mt: 2, pl: 2, borderLeft: "3px solid", borderColor: "info.main" }}>
                {scopeInfo.capabilities && scopeInfo.capabilities.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      You Can:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {scopeInfo.capabilities.map((cap, idx) => (
                        <li key={idx}>
                          <Typography variant="body2" component="span">
                            {cap}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
                {scopeInfo.restrictions && scopeInfo.restrictions.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      You Cannot:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {scopeInfo.restrictions.map((restriction, idx) => (
                        <li key={idx}>
                          <Typography variant="body2" component="span" color="text.secondary">
                            {restriction}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Alert>
        );
      })()}

      {/* Role Tag */}
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

      {/* Search Bar */}
      <Toolbar>
        <SearchInput
          placeholder="Search by description or document number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>


      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginTop: "1.2rem",
        }}
      >
        <SummaryCard
          icon={<FileText size={20} />}
          label="Invoices"
          value={summary.totalInvoices || invoices.length}
        />
        <SummaryCard
          icon={<TrendingUp size={20} color="#16a34a" />}
          label="Credit Notes"
          value={`₹${summary.totalCredit || 0}`}
        />
        <SummaryCard
          icon={<TrendingDown size={20} color="#dc2626" />}
          label="Debit Notes"
          value={`₹${summary.totalDebit || 0}`}
        />
        <SummaryCard
          icon={<Wallet size={20} />}
          label="Outstanding"
          value={`₹${summary.totalOutstanding || invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0).toLocaleString()}`}
        />
        {pendingPayments.length > 0 && (
          <SummaryCard
            icon={<Clock size={20} color="#f59e0b" />}
            label="Pending Approvals"
            value={pendingPayments.length}
            urgent={pendingPayments.length > 0}
          />
        )}
      </div>


      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {/* Invoice Trend Chart */}
        <ChartCard title="Monthly Invoice Trends" icon={<BarChart3 size={18} />}>
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
        </ChartCard>

        {/* Pie - Payment Distribution */}
        <ChartCard title="Payment Distribution" icon={<CreditCard size={18} />}>
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
        </ChartCard>
      </div>


      {/* Account Statement Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginTop: "2rem",
          padding: "1rem",
        }}
      >
        <h4 style={{ color: "#111827", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} /> Recent Account Statements
        </h4>

        {loading ? (
          <p style={{ color: "#9ca3af" }}>Loading statements...</p>
        ) : (
          <DataTable columns={columns} rows={filtered.slice(0, 8)} />
        )}
      </div>


      {/* Outstanding Invoices from Available Data */}
      {(() => {
        // Calculate outstanding from invoices we have access to
        const outstanding = invoices.filter(inv => {
          const outstanding = (inv.totalAmount || 0) - (inv.paidAmount || 0);
          return outstanding > 0;
        });

        if (outstanding.length === 0) return null;

        return (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              marginTop: "2rem",
              padding: "1rem",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <AlertTriangle size={18} color="#ef4444" /> Outstanding Invoices
              </h4>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Eye size={16} />}
                onClick={() => navigate("/accounts/invoices")}
              >
                View All Invoices
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {outstanding.slice(0, 5).map((inv) => {
                const outstandingAmount = (inv.totalAmount || 0) - (inv.paidAmount || 0);
                return (
                  <Box
                    key={inv.id}
                    sx={{
                      p: 1.5,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {inv.invoiceNumber || `Invoice #${inv.id?.slice(0, 8)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.dealer?.businessName || inv.dealerName || "N/A"} • {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                        ₹{outstandingAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Outstanding
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </div>
        );
      })()}

      {/* Pending Payment Approvals Section */}
      {pendingPayments.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            marginTop: "2rem",
            padding: "1rem",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <Clock size={18} color="#f59e0b" /> Pending Payment Approvals
            </h4>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Eye size={16} />}
              onClick={() => navigate("/payments/finance/pending")}
            >
              Review All
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {pendingPayments.slice(0, 5).map((payment) => (
              <Box
                key={payment.id}
                sx={{
                  p: 1.5,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Payment #{payment.id?.slice(0, 8)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payment.dealer?.businessName || payment.dealerName || "N/A"} • {payment.invoice?.invoiceNumber || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{Number(payment.amount || 0).toLocaleString()}
                  </Typography>
                  <Chip
                    label={payment.approvalStage || "Pending"}
                    size="small"
                    color="warning"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </div>
      )}


      {/* Reconciliation Status */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div
          style={{
            background: reconciliation.length ? "#fee2e2" : "#dcfce7",
            padding: "1rem",
            borderRadius: "12px",
            flex: 1,
            minWidth: "220px",
          }}
        >
          <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCcw size={18} /> Reconciliation Status
          </h4>
          <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {reconciliation.length ? (
              <AlertCircle size={18} color="#dc2626" />
            ) : (
              <CheckCircle2 size={18} color="#16a34a" />
            )}
            {reconciliation.length
              ? `${reconciliation.length} invoice(s) pending`
              : "All accounts are reconciled"}
          </p>
        </div>
      </div>
    </div>
  );
}


// Reusable Summary Card Component
function SummaryCard({ icon, label, value, urgent }) {
  return (
    <div
      style={{
        background: urgent ? "#fef3c7" : "white",
        padding: "1rem",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: urgent ? "0 2px 8px rgba(239, 68, 68, 0.2)" : "0 2px 6px rgba(0,0,0,0.05)",
        border: urgent ? "1px solid #fbbf24" : "none",
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>{label}</div>
        <div style={{ fontWeight: 700, color: urgent ? "#dc2626" : "#111827" }}>{value}</div>
      </div>
    </div>
  );
}


// Reusable Chart Container
function ChartCard({ title, icon, children }) {
  return (
    <div
      style={{
        background: "white",
        padding: "1rem",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
