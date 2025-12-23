import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { dashboardAPI, orderAPI, paymentAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";

export default function SalesExecutiveDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({
    myOrders: 0,
    myPayments: 0,
    assignedDealers: 0,
  });
  const [previousSummary, setPreviousSummary] = useState({});
  const [ordersTrend, setOrdersTrend] = useState([]);
  const [paymentsTrend, setPaymentsTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);

      // Reuse manager dashboard endpoints; backend should scope by sales_executive
      const [
        managerSummary,
        prevManagerSummary,
        ordersData,
        prevOrdersData,
        paymentsData,
        prevPaymentsData,
      ] = await Promise.all([
        dashboardAPI.getManagerDashboard(params).catch(() => ({})),
        dashboardAPI.getManagerDashboard(prevParams).catch(() => ({})),
        orderAPI.getMyOrders({ ...params, limit: 20 }).catch(() => ({ data: [] })),
        orderAPI.getMyOrders({ ...prevParams, limit: 20 }).catch(() => ({ data: [] })),
        paymentAPI.getMyRequests({ ...params, limit: 20 }).catch(() => ({ data: [] })),
        paymentAPI.getMyRequests({ ...prevParams, limit: 20 }).catch(() => ({ data: [] })),
      ]);

      const orders = ordersData?.data || ordersData || [];
      const payments = paymentsData?.data || paymentsData || [];

      setSummary({
        myOrders: orders.length || 0,
        myPayments: payments.length || 0,
        assignedDealers: managerSummary?.assignedDealers || managerSummary?.dealersCount || 0,
      });

      setPreviousSummary({
        myOrders: (prevOrdersData?.data || prevOrdersData || []).length || 0,
        myPayments: (prevPaymentsData?.data || prevPaymentsData || []).length || 0,
      });

      setRecentOrders(orders);
      setRecentPayments(payments);
      setOrdersTrend(formatTrendData(orders));
      setPaymentsTrend(formatTrendData(payments));
    } catch (error) {
      // For sales exec, silently degrade to empty data on scope/permission issues
      console.warn("Failed to load sales executive dashboard data:", error);
      setSummary({ myOrders: 0, myPayments: 0, assignedDealers: 0 });
      setPreviousSummary({});
      setOrdersTrend([]);
      setPaymentsTrend([]);
      setRecentOrders([]);
      setRecentPayments([]);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getTimeRangeParams(range, previous = false) {
    const now = new Date();
    let startDate, endDate;

    const days =
      range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : range === "6m" ? 180 : 365;

    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    if (previous) {
      const diff = endDate - startDate;
      endDate = new Date(startDate);
      startDate = new Date(startDate.getTime() - diff);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  function formatTrendData(data) {
    if (!Array.isArray(data)) return [];
    const grouped = {};
    data.forEach((item) => {
      const date = new Date(item.createdAt || item.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[month]) {
        grouped[month] = { label: month, value: 0 };
      }
      grouped[month].value += 1;
    });
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <PageHeader
          title="Sales Executive Dashboard"
          subtitle="Your dealers, orders, and payment requests"
        />
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* High-level KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
          title="My Payment Requests"
          current={summary.myPayments || 0}
          previous={previousSummary.myPayments || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-success)"
        />
        <StatCard
          title="Assigned Dealers"
          value={summary.assignedDealers || 0}
          scope="Sales Territory"
          onClick={() => navigate("/sales/my-dealers")}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* Trends */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <Card title="Orders Trend">
          <TrendLineChart
            data={ordersTrend}
            dataKeys={["value"]}
            colors={["var(--color-primary)"]}
            height={260}
          />
        </Card>
        <Card title="Payment Requests Trend">
          <TrendLineChart
            data={paymentsTrend}
            dataKeys={["value"]}
            colors={["var(--color-success)"]}
            height={260}
          />
        </Card>
      </div>

      {/* Recent activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <Card title="Recent Orders">
          {recentOrders.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentOrders.slice(0, 6).map((order) => (
                <li
                  key={order.id}
                  onClick={() => navigate("/sales/orders/new")}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  <strong>{order.orderNumber || order.id}</strong>
                  <br />
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {order.status} • ₹{Number(order.totalAmount || 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent orders yet. Use the Create Order action in the sidebar to get started.
            </Typography>
          )}
        </Card>

        <Card title="Recent Payment Requests">
          {recentPayments.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentPayments.slice(0, 6).map((payment) => (
                <li
                  key={payment.id}
                  onClick={() => navigate("/sales/payments/new")}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  <strong>₹{Number(payment.amount || 0).toLocaleString()}</strong>
                  <br />
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {payment.status || "pending"} • {payment.invoiceNumber || "Invoice"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent payment requests yet. Use the Create Payment Request action in the sidebar.
            </Typography>
          )}
        </Card>
      </div>
    </div>
  );
}


