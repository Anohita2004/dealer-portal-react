import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI, orderAPI, documentAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TaskList from "../../components/TaskList";
import { useApiCall } from "../../hooks/useApiCall";
import "./DashboardLayout.css";

export default function DealerStaffDashboard() {
  const navigate = useNavigate();
  const { get, loading } = useApiCall();
  const [summary, setSummary] = useState({
    myOrders: 0,
    pendingOrders: 0,
    myPayments: 0,
    pendingPayments: 0,
    myTasks: 0,
    unreadDocs: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dealer dashboard data (scoped to current user)
      const dashboardData = await dashboardAPI.getDealerDashboard();
      
      // Fetch my orders
      const ordersData = await orderAPI.getMyOrders({ limit: 5 });
      
      // Fetch my payment requests
      const paymentsData = await get("/payments/mine", { params: { limit: 5 } });
      
      // Fetch documents count
      const docsData = await documentAPI.getDocuments({ limit: 1 });

      // Update summary
      setSummary({
        myOrders: ordersData?.data?.length || ordersData?.length || 0,
        pendingOrders: ordersData?.data?.filter(o => o.status === "pending")?.length || 0,
        myPayments: paymentsData?.data?.length || paymentsData?.length || 0,
        pendingPayments: paymentsData?.data?.filter(p => p.status === "pending")?.length || 0,
        myTasks: dashboardData?.pendingTasks || 0,
        unreadDocs: docsData?.documents?.filter(d => !d.isRead)?.length || 0,
      });

      // Set recent orders
      setRecentOrders(ordersData?.data || ordersData || []);
      
      // Set recent payments
      setRecentPayments(paymentsData?.data || paymentsData || []);
    } catch (error) {
      console.error("Failed to fetch dealer staff dashboard data:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader 
        title="My Dashboard" 
        subtitle="Your orders, payments, and tasks" 
      />

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
                      cursor: "pointer"
                    }}
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
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
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
                      cursor: "pointer"
                    }}
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
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
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
