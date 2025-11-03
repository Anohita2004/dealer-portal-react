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
import { motion } from "framer-motion";
import {
  FileText,
  TrendingUp,
  Receipt,
  Gift,
  FileCheck,
  Upload,
  Phone,
  Download,
} from "lucide-react";

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
        const [summaryRes, invoiceRes, promoRes, docRes, trendRes] = await Promise.all([
          api.get("/reports/dealer-performance"),
          api.get("/invoices"),
          api.get("/campaigns/active"),
          api.get("/documents"),
          api.get("/reports/dealer-performance?trend=true"),
        ]);
        setSummary(summaryRes.data);
        setInvoices(invoiceRes.data.invoices || invoiceRes.data);
        setPromotions(promoRes.data);
        setDocuments(docRes.data);
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
    return (
      <div className="p-10 text-center text-blue-700 font-semibold animate-pulse">
        Loading your dashboard...
      </div>
    );

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-blue-800 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Dealer Dashboard
        </h2>
        <p className="text-gray-600 mt-2">
          Welcome back,{" "}
          <span className="font-semibold text-blue-700">
            {summary.dealerName || "Dealer"}
          </span>
          — track your performance, documents, and offers.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <AnimatedCard icon={<TrendingUp />} title="Total Sales" value={`₹${summary.totalSales || 0}`} />
        <AnimatedCard icon={<Receipt />} title="Total Invoices" value={summary.totalInvoices || 0} />
        <AnimatedCard icon={<FileCheck />} title="Pending Deliveries" value={summary.pendingDeliveries || 0} />
        <AnimatedCard icon={<FileText />} title="Outstanding Amount" value={`₹${summary.outstanding || 0}`} />
      </div>

      {/* Sales Trend */}
      <SectionCard title="Sales Trend (Last 6 Months)">
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm">No trend data available</p>
        )}
      </SectionCard>

      {/* Invoices */}
      <SectionCard title="Recent Invoices">
        <Table
          headers={["Invoice #", "Date", "Amount", "Status", "Action"]}
          rows={invoices.slice(0, 5).map((i) => ({
            data: [
              i.invoiceNumber,
              new Date(i.invoiceDate).toLocaleDateString(),
              `₹${i.totalAmount}`,
              <span
                className={`font-semibold ${
                  i.status === "Paid"
                    ? "text-green-600"
                    : i.status === "Pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {i.status}
              </span>,
              <span className="text-blue-600 hover:underline cursor-pointer">
                Download
              </span>,
            ],
          }))}
        />
      </SectionCard>

      {/* Promotions */}
      <SectionCard title="Active Promotions">
        {promotions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                whileHover={{ scale: 1.03 }}
                className="p-4 border rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-sm"
              >
                <h4 className="font-bold text-blue-700 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  {promo.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Valid till: {new Date(promo.validTill).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active promotions</p>
        )}
      </SectionCard>

      {/* Documents */}
      <SectionCard title="Uploaded Documents">
        {documents.length > 0 ? (
          <Table
            headers={["File Name", "Type", "Status", "Uploaded On"]}
            rows={documents.map((doc) => ({
              data: [
                doc.fileName,
                doc.documentType,
                <span
                  className={`font-medium ${
                    doc.status === "Approved"
                      ? "text-green-600"
                      : doc.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {doc.status}
                </span>,
                new Date(doc.createdAt).toLocaleDateString(),
              ],
            }))}
          />
        ) : (
          <p className="text-gray-500 text-sm">No documents uploaded yet</p>
        )}
      </SectionCard>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-end mt-8">
        <ActionButton color="blue" icon={<Upload />} text="Upload New License" />
        <ActionButton color="green" icon={<Download />} text="Download Statement" />
        <ActionButton color="yellow" icon={<Phone />} text="Contact TM" />
      </div>
    </div>
  );
}

/* =======================
   Reusable UI Components
======================= */

const AnimatedCard = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white shadow-lg rounded-2xl p-5 border-t-4 border-blue-500 transition-all"
  >
    <div className="flex justify-between items-center">
      <div>
        <h4 className="text-gray-500 text-sm">{title}</h4>
        <p className="text-2xl font-bold text-blue-700 mt-1">{value}</p>
      </div>
      <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">{icon}</div>
    </div>
  </motion.div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
    <h3 className="text-lg font-semibold text-blue-800 mb-4">{title}</h3>
    {children}
  </div>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          {headers.map((h, i) => (
            <th key={i} className="p-3 border text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-blue-50 transition">
            {row.data.map((cell, j) => (
              <td key={j} className="p-3 border">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionButton = ({ color, icon, text }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
  };
  return (
    <button
      className={`${colors[color]} text-white px-6 py-2 rounded-xl shadow flex items-center gap-2 transition`}
    >
      {icon}
      {text}
    </button>
  );
};
