import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket"; // ✅ new socket import
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DealerDashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📦 Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, invoiceRes, promoRes, docRes, trendRes] = await Promise.all([
          api.get("/reports/dealer-performance"),
          api.get("/invoices"),
          api.get("/campaigns/active"),
          api.get("/documents"),
          api.get("/reports/dealer-performance?trend=true"),
        ]);

        setSummary(summaryRes.data);
        setInvoices(invoiceRes.data.invoices || invoiceRes.data || []);
        setPromotions(promoRes.data || []);
        setDocuments(docRes.data.documents || []);
        setTrend(trendRes.data.trend || []);
      } catch (err) {
        console.error("Error loading dealer dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ⚡ Real-time socket events
  useEffect(() => {
    // Authenticate socket with stored token
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };

    socket.connect();

    socket.on("connect", () => {
      console.log("🔌 Connected to backend socket server");
    });

    // ✅ Document approval / rejection updates
    socket.on("document:update", (data) => {
      toast.info(data.message || `Document ${data.status}`);
      setDocuments((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, status: data.status } : d))
      );
    });

    // ✅ New messages from TM/AM
    socket.on("message:reply", (msg) => {
      toast.success(`💬 New reply from ${msg.senderRole}: ${msg.content}`);
    });

    // ✅ New promotions or campaigns pushed by TM/AM
    socket.on("promotion:new", (promo) => {
      toast.info(`🎉 New promotion: ${promo.title}`);
      setPromotions((prev) => [promo, ...prev]);
    });

    // ✅ Optional: General notifications (like license validity)
    socket.on("notification:update", (notif) => {
      toast.info(`🔔 ${notif.message || "You have new updates"}`);
    });

    return () => {
      socket.off("document:update");
      socket.off("message:reply");
      socket.off("promotion:new");
      socket.off("notification:update");
      socket.disconnect();
    };
  }, []);

  if (loading)
    return (
      <div style={styles.loading}>
        <p style={{ color: "#94a3b8" }}>Loading dashboard...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>Dealer Dashboard</h2>
        <p style={styles.subtitle}>
          Welcome back,{" "}
          <strong style={{ color: "#60a5fa" }}>
            {summary.dealerName || "Dealer"}
          </strong>{" "}
          — stay on top of your performance and updates.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.cardGrid}>
        <Card title="Total Sales" value={`₹${summary.totalSales || 0}`} icon="💰" />
        <Card title="Total Invoices" value={summary.totalInvoices || 0} icon="🧾" />
        <Card title="Pending Deliveries" value={summary.pendingDeliveries || 0} icon="🚚" />
        <Card title="Outstanding Amount" value={`₹${summary.outstanding || 0}`} icon="📉" />
      </div>

      {/* SALES TREND */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Sales Trend (Last 6 Months)</h3>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.muted}>No trend data available</p>
        )}
      </div>

      {/* RECENT INVOICES */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Recent Invoices</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 5).map((i) => (
              <tr key={i.id} style={styles.tableRow}>
                <td>{i.invoiceNumber}</td>
                <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
                <td>₹{i.totalAmount}</td>
                <td style={{ color: i.status === "Paid" ? "#22c55e" : "#facc15" }}>
                  {i.status}
                </td>
                <td style={styles.action}>Download</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ACTIVE PROMOTIONS */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Active Promotions</h3>
        {promotions.length > 0 ? (
          <div style={styles.cardGrid}>
            {promotions.map((promo) => (
              <div key={promo.id} style={styles.smallCard}>
                <h4 style={{ color: "#60a5fa" }}>{promo.title}</h4>
                <p style={styles.muted}>{promo.description}</p>
                <p style={styles.small}>
                  Valid till: {new Date(promo.validTill).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.muted}>No active promotions</p>
        )}
      </div>

      {/* DOCUMENTS */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Uploaded Documents</h3>
        {documents.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>File Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded On</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={styles.tableRow}>
                  <td>{doc.fileName}</td>
                  <td>{doc.documentType}</td>
                  <td
                    style={{
                      color:
                        doc.status === "approved"
                          ? "#22c55e"
                          : doc.status === "rejected"
                          ? "#ef4444"
                          : "#facc15",
                    }}
                  >
                    {doc.status}
                  </td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.muted}>No documents uploaded yet</p>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div style={styles.actionRow}>
        <button style={styles.primaryBtn}>Upload New License</button>
        <button
          style={{
            ...styles.primaryBtn,
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
          }}
        >
          Download Statement
        </button>
        <button
          style={{
            ...styles.primaryBtn,
            background: "linear-gradient(90deg, #facc15, #eab308)",
          }}
        >
          Contact TM
        </button>
      </div>
    </div>
  );
}

// Reusable Card
const Card = ({ title, value, icon }) => (
  <div style={styles.card}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4 style={{ margin: 0 }}>{title}</h4>
    </div>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

// 🎨 Inline Styles (unchanged)
const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top left, #0f172a, #020617 70%)",
    color: "#e2e8f0",
    fontFamily: "'Poppins', sans-serif",
    padding: "2rem",
  },
  header: { marginBottom: "2rem" },
  title: { fontSize: "2rem", color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", fontSize: "0.9rem" },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
    marginTop: "1.5rem",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 25px rgba(0,0,0,0.4)",
    transition: "all 0.3s ease",
  },
  cardValue: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#3b82f6",
    marginTop: "0.5rem",
  },
  sectionCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    marginTop: "2rem",
    boxShadow: "0 4px 25px rgba(0,0,0,0.3)",
  },
  sectionTitle: { marginBottom: "1rem", color: "#f1f5f9" },
  muted: { color: "#94a3b8" },
  small: { fontSize: "0.8rem", color: "#64748b" },
  smallCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
    color: "#e2e8f0",
  },
  tableHeader: {
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
  },
  tableRow: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  action: {
    color: "#3b82f6",
    cursor: "pointer",
  },
  actionRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
  },
  primaryBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "0.8rem 1.5rem",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
    transition: "all 0.3s ease",
  },
  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top left, #0f172a, #020617 70%)",
  },
};
