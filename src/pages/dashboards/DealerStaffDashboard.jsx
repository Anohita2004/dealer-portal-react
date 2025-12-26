import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { dashboardAPI, orderAPI, documentAPI, paymentAPI, invoiceAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TaskList from "../../components/TaskList";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import IconPillButton from "../../components/IconPillButton";
import {
  ShoppingCart,
  CreditCard,
  FileText,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  DollarSign,
  FolderOpen,
} from "lucide-react";
import "./DashboardLayout.css";

// Loading skeleton component
const LoadingSkeleton = ({ width = "100%", height = "20px", style = {} }) => (
  <div
    style={{
      width,
      height,
      background: "linear-gradient(90deg, var(--color-surface) 25%, var(--color-background) 50%, var(--color-surface) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      borderRadius: "6px",
      ...style,
    }}
  />
);

export default function DealerStaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({
    myOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    myPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalPaymentAmount: 0,
    totalOrderAmount: 0,
    myTasks: 0,
    unreadDocs: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
  });
  const [previousSummary, setPreviousSummary] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [ordersTrend, setOrdersTrend] = useState([]);
  const [paymentsTrend, setPaymentsTrend] = useState([]);
  const [dashboardData, setDashboardData] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);

      // Fetch all data in parallel for performance
      const [
        dashboardRes,
        prevDashboardRes,
        ordersRes,
        prevOrdersRes,
        paymentsRes,
        prevPaymentsRes,
        docsRes,
        invoicesRes,
      ] = await Promise.allSettled([
        dashboardAPI.getDealerDashboard(params),
        dashboardAPI.getDealerDashboard(prevParams),
        orderAPI.getMyOrders({ ...params, limit: 10 }),
        orderAPI.getMyOrders({ ...prevParams, limit: 10 }),
        paymentAPI.getMyRequests({ ...params, limit: 10 }),
        paymentAPI.getMyRequests({ ...prevParams, limit: 10 }),
        documentAPI.getDocuments({ ...params, limit: 10 }),
        invoiceAPI.getInvoices({ ...params, limit: 5 }),
      ]);

      // Extract data from settled promises
      const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value : {};
      const prevDashboard = prevDashboardRes.status === 'fulfilled' ? prevDashboardRes.value : {};
      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || ordersRes.value || []) : [];
      const prevOrders = prevOrdersRes.status === 'fulfilled' ? (prevOrdersRes.value?.data || prevOrdersRes.value || []) : [];
      const payments = paymentsRes.status === 'fulfilled' ? (paymentsRes.value?.data || paymentsRes.value || []) : [];
      const prevPayments = prevPaymentsRes.status === 'fulfilled' ? (prevPaymentsRes.value?.data || prevPaymentsRes.value || []) : [];
      const docs = docsRes.status === 'fulfilled' ? (docsRes.value?.documents || docsRes.value?.data?.documents || []) : [];
      const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value?.invoices || invoicesRes.value?.data?.invoices || []) : [];

      // Ensure orders and payments are arrays
      const ordersArray = Array.isArray(orders) ? orders : [];
      const paymentsArray = Array.isArray(payments) ? payments : [];
      const docsArray = Array.isArray(docs) ? docs : [];
      const invoicesArray = Array.isArray(invoices) ? invoices : [];

      // Calculate summary metrics
      const pendingOrdersCount = ordersArray.filter((o) => (o.status || o.approvalStatus || "").toLowerCase() === "pending").length;
      const approvedOrdersCount = ordersArray.filter((o) => (o.status || o.approvalStatus || "").toLowerCase() === "approved").length;
      const pendingPaymentsCount = paymentsArray.filter((p) => (p.status || "").toLowerCase() === "pending").length;
      const approvedPaymentsCount = paymentsArray.filter((p) => (p.status || "").toLowerCase() === "approved").length;
      const totalOrderAmount = ordersArray.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const totalPaymentAmount = paymentsArray.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingDocsCount = docsArray.filter((d) => (d.status || "").toLowerCase() === "pending").length;
      const unreadDocsCount = docsArray.filter((d) => !d.isRead).length;
      const pendingInvoicesCount = invoicesArray.filter((i) => (i.status || "").toLowerCase() !== "paid").length;

      setSummary({
        myOrders: ordersArray.length,
        pendingOrders: pendingOrdersCount,
        approvedOrders: approvedOrdersCount,
        myPayments: paymentsArray.length,
        pendingPayments: pendingPaymentsCount,
        approvedPayments: approvedPaymentsCount,
        totalOrderAmount,
        totalPaymentAmount,
        myTasks: dashboard?.pendingTasks || 0,
        unreadDocs: unreadDocsCount,
        totalDocuments: docsArray.length,
        pendingDocuments: pendingDocsCount,
        totalInvoices: invoicesArray.length,
        pendingInvoices: pendingInvoicesCount,
      });

      // Calculate previous period metrics for comparison
      const prevOrdersArray = Array.isArray(prevOrders) ? prevOrders : [];
      const prevPaymentsArray = Array.isArray(prevPayments) ? prevPayments : [];

      setPreviousSummary({
        myOrders: prevOrdersArray.length,
        myPayments: prevPaymentsArray.length,
        totalOrderAmount: prevOrdersArray.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        totalPaymentAmount: prevPaymentsArray.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      });

      // Set dashboard data from backend
      setDashboardData(dashboard);

      // Set recent items
      setRecentOrders(ordersArray);
      setRecentPayments(paymentsArray);
      setRecentDocuments(docsArray);

      // Format trends
      setOrdersTrend(formatTrendData(ordersArray, "orders"));
      setPaymentsTrend(formatTrendData(paymentsArray, "payments"));
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 403 || error.response?.status === 404 || error.silent) {
        // Silently handle expected errors
        setSummary({
          myOrders: 0, pendingOrders: 0, approvedOrders: 0,
          myPayments: 0, pendingPayments: 0, approvedPayments: 0,
          totalOrderAmount: 0, totalPaymentAmount: 0, myTasks: 0,
          unreadDocs: 0, totalDocuments: 0, pendingDocuments: 0,
          totalInvoices: 0, pendingInvoices: 0,
        });
        setRecentOrders([]);
        setRecentPayments([]);
        setRecentDocuments([]);
      } else {
        console.error("Failed to fetch dealer staff dashboard data:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getTimeRangeParams(range, previous = false) {
    const now = new Date();
    let startDate, endDate;

    if (typeof range === 'object' && range.type === 'custom') {
      startDate = new Date(range.startDate);
      endDate = new Date(range.endDate);
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '6m' ? 180 : 365;
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
    }

    if (previous) {
      const diff = endDate - startDate;
      endDate = new Date(startDate);
      startDate = new Date(startDate.getTime() - diff);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  function formatTrendData(data, type) {
    if (!Array.isArray(data)) return [];
    const grouped = {};
    data.forEach((item) => {
      const date = new Date(item.createdAt || item.date);
      if (isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[month]) {
        grouped[month] = { label: month, value: 0, amount: 0 };
      }
      grouped[month].value += 1;
      grouped[month].amount += Number(item.totalAmount || item.amount || 0);
    });
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
  }

  function getStatusColor(status) {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "approved":
      case "paid":
        return "var(--color-success)";
      case "rejected":
      case "overdue":
        return "var(--color-error)";
      case "pending":
        return "var(--color-warning)";
      default:
        return "var(--color-text-secondary)";
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "1rem" }}>
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}
        </style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <LoadingSkeleton width="200px" height="32px" style={{ marginBottom: "8px" }} />
            <LoadingSkeleton width="300px" height="18px" />
          </div>
          <LoadingSkeleton width="200px" height="40px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} height="120px" />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} height="100px" />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <LoadingSkeleton height="300px" />
          <LoadingSkeleton height="300px" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader
          title="My Dashboard"
          subtitle="Track your orders, payments, and tasks at a glance"
        />
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <IconPillButton
          icon={<Plus size={16} />}
          label="New Order"
          onClick={() => navigate("/orders/create")}
        />
        <IconPillButton
          icon={<DollarSign size={16} />}
          label="New Payment"
          tone="success"
          onClick={() => navigate("/payments/create")}
        />
        <IconPillButton
          icon={<FolderOpen size={16} />}
          label="Upload Document"
          tone="info"
          onClick={() => navigate("/documents/upload")}
        />
      </div>

      {/* COMPARISON WIDGETS - Period over Period */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <ComparisonWidget
          title="Total Orders"
          current={summary.myOrders || 0}
          previous={previousSummary.myOrders || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-primary)"
        />
        <ComparisonWidget
          title="Total Payments"
          current={summary.myPayments || 0}
          previous={previousSummary.myPayments || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-success)"
        />
        <ComparisonWidget
          title="Order Value"
          current={summary.totalOrderAmount || 0}
          previous={previousSummary.totalOrderAmount || 0}
          formatValue={(v) => `₹${Number(v || 0).toLocaleString()}`}
          color="var(--color-primary-dark)"
        />
        <ComparisonWidget
          title="Payment Value"
          current={summary.totalPaymentAmount || 0}
          previous={previousSummary.totalPaymentAmount || 0}
          formatValue={(v) => `₹${Number(v || 0).toLocaleString()}`}
          color="var(--color-success)"
        />
      </div>

      {/* STAT CARDS - Key Metrics */}
      <div className="stat-grid">
        <StatCard
          title="My Orders"
          value={summary.myOrders}
          icon={<ShoppingCart size={20} />}
          accent="var(--color-primary)"
          onClick={() => navigate("/orders/my")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Pending Orders"
          value={summary.pendingOrders}
          icon={<Clock size={20} />}
          accent="var(--color-warning)"
          urgent={summary.pendingOrders > 0}
          onClick={() => navigate("/orders/my?status=pending")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Approved Orders"
          value={summary.approvedOrders}
          icon={<CheckCircle size={20} />}
          accent="var(--color-success)"
          onClick={() => navigate("/orders/my?status=approved")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="My Payments"
          value={summary.myPayments}
          icon={<CreditCard size={20} />}
          accent="var(--color-primary)"
          onClick={() => navigate("/payments/my")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Pending Payments"
          value={summary.pendingPayments}
          icon={<Clock size={20} />}
          accent="var(--color-warning)"
          urgent={summary.pendingPayments > 0}
          onClick={() => navigate("/payments/my?status=pending")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Approved Payments"
          value={summary.approvedPayments}
          icon={<CheckCircle size={20} />}
          accent="var(--color-success)"
          onClick={() => navigate("/payments/my?status=approved")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="My Tasks"
          value={summary.myTasks}
          icon={<ClipboardList size={20} />}
          accent="var(--color-primary-dark)"
          urgent={summary.myTasks > 0}
          onClick={() => navigate("/tasks")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Documents"
          value={summary.totalDocuments}
          icon={<FileText size={20} />}
          accent="var(--color-info)"
          onClick={() => navigate("/documents")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Pending Documents"
          value={summary.pendingDocuments}
          icon={<AlertCircle size={20} />}
          accent="var(--color-warning)"
          urgent={summary.pendingDocuments > 0}
          onClick={() => navigate("/documents?status=pending")}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* TREND CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
          marginTop: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <Card title="Orders Trend" className="chart-card">
          {ordersTrend.length > 0 ? (
            <TrendLineChart
              data={ordersTrend}
              dataKeys={["value", "amount"]}
              colors={["var(--color-primary)", "var(--color-primary-soft)"]}
              height={280}
              formatValue={(v, key) => key === "amount" ? `₹${Number(v || 0).toLocaleString()}` : v}
            />
          ) : (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="text-muted">No order data for the selected period</p>
            </div>
          )}
        </Card>

        <Card title="Payments Trend" className="chart-card">
          {paymentsTrend.length > 0 ? (
            <TrendLineChart
              data={paymentsTrend}
              dataKeys={["value", "amount"]}
              colors={["var(--color-success)", "var(--color-success-soft)"]}
              height={280}
              formatValue={(v, key) => key === "amount" ? `₹${Number(v || 0).toLocaleString()}` : v}
            />
          ) : (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="text-muted">No payment data for the selected period</p>
            </div>
          )}
        </Card>
      </div>

      {/* RECENT ACTIVITY SECTIONS */}
      <div className="dashboard-grid">
        <div className="column">
          <Card title="Recent Orders">
            {recentOrders.length > 0 ? (
              <table className="custom-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/my?id=${order.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: 600 }}>{order.orderNumber || `#${order.id?.slice(-6) || order.id}`}</td>
                      <td className="text-muted">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</td>
                      <td>₹{Number(order.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <span style={{
                          color: getStatusColor(order.status || order.approvalStatus),
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}>
                          {order.status || order.approvalStatus || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted" style={{ padding: "1rem 0" }}>No recent orders</p>
            )}
            <button
              onClick={() => navigate("/orders/create")}
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1.25rem",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              <Plus size={16} /> Create New Order
            </button>
          </Card>
        </div>

        <div className="column">
          <Card title="Recent Payment Requests">
            {recentPayments.length > 0 ? (
              <table className="custom-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.slice(0, 5).map((payment) => (
                    <tr
                      key={payment.id}
                      onClick={() => navigate(`/payments/my?id=${payment.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: 600 }}>{payment.invoiceNumber || `#${payment.id?.slice(-6) || payment.id}`}</td>
                      <td className="text-muted">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "-"}</td>
                      <td>₹{Number(payment.amount || 0).toLocaleString()}</td>
                      <td>
                        <span style={{
                          color: getStatusColor(payment.status),
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}>
                          {payment.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted" style={{ padding: "1rem 0" }}>No recent payments</p>
            )}
            <button
              onClick={() => navigate("/payments/create")}
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1.25rem",
                background: "var(--color-success)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              <DollarSign size={16} /> Create Payment Request
            </button>
          </Card>
        </div>
      </div>

      {/* DOCUMENTS SECTION */}
      {recentDocuments.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <Card title="Recent Documents">
            <table className="custom-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.slice(0, 5).map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 600 }}>{doc.fileName || doc.name || "Document"}</td>
                    <td className="text-muted">{doc.documentType || doc.type || "-"}</td>
                    <td className="text-muted">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <span style={{
                        color: getStatusColor(doc.status),
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}>
                        {doc.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* PENDING TASKS */}
      <div style={{ marginTop: "2rem" }}>
        <Card title="My Pending Tasks">
          <TaskList compact={true} />
        </Card>
      </div>
    </div>
  );
}
