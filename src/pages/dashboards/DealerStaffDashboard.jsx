import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI, orderAPI, documentAPI, paymentAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TaskList from "../../components/TaskList";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import { useApiCall } from "../../hooks/useApiCall";
import "./DashboardLayout.css";

export default function DealerStaffDashboard() {
  const navigate = useNavigate();
  const { get, loading } = useApiCall();
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({
    myOrders: 0,
    pendingOrders: 0,
    myPayments: 0,
    pendingPayments: 0,
    myTasks: 0,
    unreadDocs: 0,
  });
  const [previousSummary, setPreviousSummary] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [ordersTrend, setOrdersTrend] = useState([]);
  const [paymentsTrend, setPaymentsTrend] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);

      // Fetch dealer dashboard data (scoped to current user)
      const [dashboardData, prevDashboardData, ordersData, prevOrdersData, paymentsData, prevPaymentsData, docsData] = await Promise.all([
        dashboardAPI.getDealerDashboard(params),
        dashboardAPI.getDealerDashboard(prevParams).catch(() => ({})),
        orderAPI.getMyOrders({ ...params, limit: 10 }),
        orderAPI.getMyOrders({ ...prevParams, limit: 10 }).catch(() => ({ data: [] })),
        paymentAPI.getMyRequests({ ...params, limit: 10 }),
        paymentAPI.getMyRequests({ ...prevParams, limit: 10 }).catch(() => ({ data: [] })),
        documentAPI.getDocuments({ limit: 1 }),
      ]);

      // Update summary
      const orders = ordersData?.data || ordersData || [];
      const payments = paymentsData?.data || paymentsData || [];
      
      setSummary({
        myOrders: orders.length || 0,
        pendingOrders: orders.filter((o) => o.status === "pending").length || 0,
        myPayments: payments.length || 0,
        pendingPayments: payments.filter((p) => p.status === "pending").length || 0,
        myTasks: dashboardData?.pendingTasks || 0,
        unreadDocs: docsData?.documents?.filter((d) => !d.isRead)?.length || 0,
      });

      setPreviousSummary({
        myOrders: (prevOrdersData?.data || prevOrdersData || []).length || 0,
        myPayments: (prevPaymentsData?.data || prevPaymentsData || []).length || 0,
      });

      // Set recent orders
      setRecentOrders(orders);
      
      // Set recent payments
      setRecentPayments(payments);

      // Format trends
      setOrdersTrend(formatTrendData(orders, "orders"));
      setPaymentsTrend(formatTrendData(payments, "payments"));
    } catch (error) {
      // Handle 400 Bad Request (likely date range validation) silently
      // Handle 403/404 permission errors silently
      if (error.response?.status === 400 || error.response?.status === 403 || error.response?.status === 404 || error.silent) {
        // Silently handle - expected validation or permission errors
        // Set empty data to prevent UI errors
        setSummary({});
        setOrders([]);
        setPayments([]);
        setRecentOrders([]);
        setRecentPayments([]);
      } else {
        // Only log unexpected errors
        console.error("Failed to fetch dealer staff dashboard data:", error);
      }
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getTimeRangeParams(range, previous = false) {
    const now = new Date();
    let startDate, endDate;

    if (typeof range === 'object' && range.type === 'custom') {
      startDate = range.startDate;
      endDate = range.endDate;
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
    // Group by month
    const grouped = {};
    data.forEach((item) => {
      const date = new Date(item.createdAt || item.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[month]) {
        grouped[month] = { label: month, value: 0, amount: 0 };
      }
      grouped[month].value += 1;
      grouped[month].amount += Number(item.totalAmount || item.amount || 0);
    });
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader 
          title="My Dashboard" 
          subtitle="Your orders, payments, and tasks" 
        />
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* COMPARISON WIDGETS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <ComparisonWidget
          title="My Orders"
          current={summary.myOrders || 0}
          previous={previousSummary.myOrders || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-primary)"
        />
        <ComparisonWidget
          title="My Payments"
          current={summary.myPayments || 0}
          previous={previousSummary.myPayments || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-success)"
        />
      </div>

      <div className="stat-grid">
        <StatCard 
          title="My Orders" 
          value={summary.myOrders}
          onClick={() => navigate("/orders/my")}
          style={{ cursor: "pointer" }}
        />
        <StatCard 
          title="Pending Orders" 
          value={summary.pendingOrders}
          onClick={() => navigate("/orders/my?status=pending")}
          style={{ cursor: "pointer" }}
        />
        <StatCard 
          title="My Payments" 
          value={summary.myPayments}
          onClick={() => navigate("/payments/my")}
          style={{ cursor: "pointer" }}
        />
        <StatCard 
          title="Pending Payments" 
          value={summary.pendingPayments}
          onClick={() => navigate("/payments/my?status=pending")}
          style={{ cursor: "pointer" }}
        />
        <StatCard 
          title="My Tasks" 
          value={summary.myTasks}
          onClick={() => navigate("/tasks")}
          style={{ cursor: "pointer" }}
        />
        <StatCard 
          title="Unread Documents" 
          value={summary.unreadDocs}
          onClick={() => navigate("/documents")}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* TREND CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <Card title="Orders Trend">
          <TrendLineChart
            data={ordersTrend}
            dataKeys={["value"]}
            colors={["var(--color-primary)"]}
            height={250}
          />
        </Card>

        <Card title="Payments Trend">
          <TrendLineChart
            data={paymentsTrend}
            dataKeys={["value"]}
            colors={["var(--color-success)"]}
            height={250}
          />
        </Card>
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Recent Orders">
            {loading ? (
              <p className="text-muted">Loading...</p>
            ) : recentOrders.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {recentOrders.slice(0, 5).map((order) => (
                  <li 
                    key={order.id}
                    onClick={() => navigate(`/orders/my?id=${order.id}`)}
                    style={{ 
                      padding: "0.5rem", 
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "var(--color-background)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    <strong>{order.orderNumber || order.id}</strong>
                    <br />
                    <small className="text-muted">
                      {order.status} • ₹{order.totalAmount || 0}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No recent orders</p>
            )}
            <button 
              onClick={() => navigate("/orders/create")}
              style={{ 
                marginTop: "1rem", 
                padding: "0.5rem 1rem",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Create New Order
            </button>
          </Card>
        </div>

        <div className="column">
          <Card title="Recent Payment Requests">
            {loading ? (
              <p className="text-muted">Loading...</p>
            ) : recentPayments.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {recentPayments.slice(0, 5).map((payment) => (
                  <li 
                    key={payment.id}
                    onClick={() => navigate(`/payments/my?id=${payment.id}`)}
                    style={{ 
                      padding: "0.5rem", 
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "var(--color-background)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    <strong>₹{payment.amount || 0}</strong>
                    <br />
                    <small className="text-muted">
                      {payment.status} • {payment.invoiceNumber || "N/A"}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No recent payments</p>
            )}
            <button 
              onClick={() => navigate("/payments/create")}
              style={{ 
                marginTop: "1rem", 
                padding: "0.5rem 1rem",
                background: "var(--color-success)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Create Payment Request
            </button>
          </Card>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Card title="My Pending Tasks">
          <TaskList compact={true} />
        </Card>
      </div>
    </div>
  );
}
