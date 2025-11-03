import React, { useEffect, useState } from "react";
import api from "../../services/api";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summaryRes = await api.get("/reports/dealer-performance");
        setSummary(summaryRes.data);

        const invoiceRes = await api.get("/invoices");
        setInvoices(invoiceRes.data.invoices || invoiceRes.data);

        const promoRes = await api.get("/campaigns/active");
        setPromotions(promoRes.data);

        const docRes = await api.get("/documents");
        setDocuments(docRes.data);

        const trendRes = await api.get("/reports/dealer-performance?trend=true");
        setTrend(trendRes.data.trend || []);
      } catch (err) {
        console.error("Error loading dealer dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="center text-center" style={{ height: "80vh" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      {/* HEADER */}
      <div className="mt-2">
        <h2>Dealer Dashboard</h2>
        <p style={{ color: "#94a3b8" }}>
          Welcome back, <strong>{summary.dealerName || "Dealer"}</strong> — stay on top of your performance and updates.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid mt-4">
        <Card title="Total Sales" value={`₹${summary.totalSales || 0}`} icon="💰" />
        <Card title="Total Invoices" value={summary.totalInvoices || 0} icon="🧾" />
        <Card title="Pending Deliveries" value={summary.pendingDeliveries || 0} icon="🚚" />
        <Card title="Outstanding Amount" value={`₹${summary.outstanding || 0}`} icon="📉" />
      </div>

      {/* SALES TREND */}
      <div className="card mt-6">
        <h3>Sales Trend (Last 6 Months)</h3>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No trend data available</p>
        )}
      </div>

      {/* RECENT INVOICES */}
      <div className="card mt-6">
        <h3>Recent Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 5).map((i) => (
              <tr key={i.id}>
                <td>{i.invoiceNumber}</td>
                <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
                <td>₹{i.totalAmount}</td>
                <td style={{ color: i.status === "Paid" ? "#22c55e" : "#facc15" }}>
                  {i.status}
                </td>
                <td className="hover-glow" style={{ color: "#3b82f6", cursor: "pointer" }}>
                  Download
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ACTIVE PROMOTIONS */}
      <div className="card mt-6">
        <h3>Active Promotions</h3>
        {promotions.length > 0 ? (
          <div className="grid">
            {promotions.map((promo) => (
              <div key={promo.id} className="card hover-glow">
                <h4 style={{ color: "#60a5fa" }}>{promo.title}</h4>
                <p style={{ color: "#94a3b8" }}>{promo.description}</p>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Valid till: {new Date(promo.validTill).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>No active promotions</p>
        )}
      </div>

      {/* DOCUMENTS */}
      <div className="card mt-6">
        <h3>Uploaded Documents</h3>
        {documents.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded On</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.fileName}</td>
                  <td>{doc.documentType}</td>
                  <td
                    style={{
                      color:
                        doc.status === "Approved"
                          ? "#22c55e"
                          : doc.status === "Rejected"
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
          <p style={{ color: "#94a3b8" }}>No documents uploaded yet</p>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <button className="primary">Upload New License</button>
        <button className="primary" style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)" }}>
          Download Statement
        </button>
        <button className="primary" style={{ background: "linear-gradient(90deg, #facc15, #eab308)" }}>
          Contact TM
        </button>
      </div>
    </div>
  );
}

// Reusable Card
const Card = ({ title, value, icon }) => (
  <div className="card">
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4>{title}</h4>
    </div>
    <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#3b82f6" }}>{value}</p>
  </div>
);
