import React, { useState } from "react";
import api from "../services/api";
import { Button, TextField, MenuItem } from "@mui/material";
import BarChartCard from "../components/BarChartCard";
import PieChartCard from "../components/PieChartCard";
import DashboardCard from "../components/DashboardCard";
import { Download } from "@mui/icons-material";

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dealerId: "",
    productGroup: "",
    invoiceNumber: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchReport = async () => {
    if (!reportType) return alert("Please select a report type");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/reports/${reportType}?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!reportType) return alert("Please select a report type first");
    const res = await api.get(`/reports/${reportType}?format=${format}`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], {
      type: format === "pdf" ? "application/pdf" : "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportType}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadInvoicePDF = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading invoice PDF:", err);
      alert("Failed to download invoice copy");
    }
  };

  const renderDashboard = () => {
    if (!data) return null;

    switch (reportType) {
      /** ===========================
       * Dealer Performance Report
       ============================ */
      case "dealer-performance":
        return (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              <DashboardCard
                title="Total Invoices"
                value={data.totalInvoices || 0}
              />
              <DashboardCard
                title="Total Sales"
                value={`₹${data.totalSales || 0}`}
              />
              <DashboardCard
                title="Pending Amount"
                value={`₹${data.pendingAmount || 0}`}
              />
            </div>

            <div style={{ marginTop: "2rem" }}>
              <BarChartCard
                title="Dealer-wise Sales Performance"
                data={(data?.invoices || []).map((inv) => ({
                  name: inv?.dealer?.businessName || "Unknown Dealer",
                  total: inv?.totalAmount || 0,
                }))}
                xKey="name"
                yKey="total"
              />
            </div>

            <div style={{ marginTop: "2rem" }}>
              <PieChartCard
                title="Product Group Sales Volume"
                data={Object.entries(
                  (data?.invoices || []).reduce((groups, inv) => {
                    const group = inv?.productGroup || "Others";
                    groups[group] =
                      (groups[group] || 0) + (inv?.totalAmount || 0);
                    return groups;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
              />
            </div>
          </>
        );

      /** ===========================
       * Account Statement Report
       ============================ */
      case "account-statement":
        return (
          <div style={{ marginTop: "2rem" }}>
            <DashboardCard
              title="Opening Balance"
              value={`₹${data.openingBalance || 0}`}
            />
            <DashboardCard
              title="Closing Balance"
              value={`₹${data.closingBalance || 0}`}
            />
            <DashboardCard
              title="Total Debit"
              value={`₹${data.totalDebit || 0}`}
            />
            <DashboardCard
              title="Total Credit"
              value={`₹${data.totalCredit || 0}`}
            />
          </div>
        );

      /** ===========================
       * Invoice Register Report
       ============================ */
      case "invoice-register":
        return (
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ color: "#60a5fa" }}>Invoice Register</h3>

            {/* Filters */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <TextField
                name="dealerId"
                label="Dealer ID"
                value={filters.dealerId}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              />
              <TextField
                name="productGroup"
                label="Product Group"
                value={filters.productGroup}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              />
              <TextField
                name="invoiceNumber"
                label="Invoice #"
                value={filters.invoiceNumber}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              />
              <TextField
                type="date"
                name="startDate"
                label="From"
                value={filters.startDate}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              />
              <TextField
                type="date"
                name="endDate"
                label="To"
                value={filters.endDate}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              />
              <TextField
                name="status"
                select
                label="Status"
                value={filters.status}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  style: { color: "#e2e8f0", backgroundColor: "#1e293b" },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
              </TextField>
            </div>

            {/* Table */}
            <table
              style={{
                width: "100%",
                color: "#e2e8f0",
                marginTop: "2rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#1e293b" }}>
                  <th style={{ padding: "0.8rem" }}>Invoice #</th>
                  <th>Date</th>
                  <th>Dealer</th>
                  <th>Product Group</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.invoices || []).map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td>{inv.dealer?.businessName || "N/A"}</td>
                    <td>{inv.productGroup || "—"}</td>
                    <td>₹{inv.totalAmount}</td>
                    <td
                      style={{
                        color:
                          inv.status === "Paid" ? "#22c55e" : "#facc15",
                        fontWeight: 500,
                      }}
                    >
                      {inv.status}
                    </td>
                    <td>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          color: "#60a5fa",
                          borderColor: "#60a5fa",
                          textTransform: "none",
                        }}
                        onClick={() => downloadInvoicePDF(inv.id)}
                      >
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ color: "#60a5fa" }}>Reports Dashboard</h2>
      <p style={{ color: "#94a3b8" }}>
        Select a report type to view insights and export data.
      </p>

      <div
        style={{ margin: "1.5rem 0", display: "flex", alignItems: "center" }}
      >
        <select
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            marginRight: "1rem",
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
          }}
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="">Select Report Type</option>
          <option value="dealer-performance">Dealer Performance</option>
          <option value="account-statement">Account Statement</option>
          <option value="invoice-register">Invoice Register</option>
        </select>

        <Button
          variant="contained"
          onClick={fetchReport}
          disabled={loading}
          sx={{ bgcolor: "#3b82f6", borderRadius: "8px", mr: 2 }}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => exportReport("pdf")}
          sx={{ color: "white", borderColor: "#3b82f6", mr: 1 }}
          startIcon={<Download />}
        >
          PDF
        </Button>

        <Button
          variant="outlined"
          onClick={() => exportReport("excel")}
          sx={{ color: "white", borderColor: "#3b82f6" }}
          startIcon={<Download />}
        >
          Excel
        </Button>
      </div>

      {renderDashboard()}
    </div>
  );
}
