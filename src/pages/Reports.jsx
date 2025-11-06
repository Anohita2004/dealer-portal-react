// src/pages/Reports.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import DashboardCard from "../components/DashboardCard";
import BarChartCard from "../components/BarChartCard";
import PieChartCard from "../components/PieChartCard";

// Small helper for dark look
const cardStyle = {
  background: "#0f1724",
  color: "#e6eef8",
  borderRadius: 12,
  boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
};

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#7c3aed", "#06b6d4"];

const REPORT_OPTIONS = [
  { value: "", label: "Select Report Type" },
  { value: "dealer-performance", label: "Dealer Performance" },
  { value: "account-statement", label: "Account Statement" },
  { value: "invoice-register", label: "Invoice Register" },
  { value: "credit-debit-notes", label: "Credit / Debit Notes" },
  { value: "outstanding-receivables", label: "Outstanding Receivables" },
  { value: "territory", label: "Territory / Region" },
  { value: "admin-summary", label: "Admin Summary" },
  { value: "pending-approvals", label: "Pending Approvals" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [filters, setFilters] = useState({
    dealerId: "",
    productGroup: "",
    invoiceNumber: "",
    startDate: "",
    endDate: "",
    status: "",
    reasonCode: "",
    state: "",
    territory: "",
    region: "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // clear data when report changes
    setData(null);
    setError("");
  }, [reportType]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildQuery = (extra = {}) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) params.append(k, v);
    });
    return params.toString();
  };

  const endpointForType = (type) => {
    // mapping kept consistent with backend routes
    return type;
  };

  const fetchReport = async () => {
    if (!reportType) {
      setError("Pick a report from the dropdown.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const endpoint = endpointForType(reportType);
      const q = buildQuery();
      const res = await api.get(`/reports/${endpoint}${q ? `?${q}` : ""}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to fetch report. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = "pdf") => {
    if (!reportType) {
      setError("Select a report to export.");
      return;
    }
    setExporting(true);
    try {
      const endpoint = endpointForType(reportType);
      const q = buildQuery({ format });
      const res = await api.get(`/reports/${endpoint}${q ? `?${q}` : ""}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.ms-excel",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${endpoint}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
      setError("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const downloadInvoicePDF = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" });
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
      setError("Failed to download invoice copy");
    }
  };

  // Derived small visual helpers
  const dealerPerformanceChartData = useMemo(() => {
    if (!data) return [];
    // backend returns array of dealers or aggregated object depending on route - handle both
    if (Array.isArray(data)) {
      // array of dealer report objects
      return data.map((d) => ({
        name: d.dealerName || d.businessName || d.dealerName || "Unknown",
        total: parseFloat(d.totalSales || 0),
      }));
    }
    // if backend returns object with productGroups etc
    return (data.dealers || []).map((d) => ({
      name: d.dealerName || d.businessName || "Unknown",
      total: parseFloat(d.totalSales || 0),
    }));
  }, [data]);

  const outstandingPieData = useMemo(() => {
    if (!data) return [];
    const aging = data.aging || data;
    if (!aging) return [];
    if (Array.isArray(aging)) return [];
    return Object.entries(aging).map(([k, v]) => ({ name: k, value: parseFloat(v || 0) }));
  }, [data]);

  // Main renderer for each report
  const renderReportBody = () => {
    if (!reportType) {
      return (
        <Card sx={{ mt: 3, ...cardStyle }}>
          <CardContent>
            <Typography variant="h6" color="inherit">
              Pick a report to begin — we’ll fetch data from your backend.
            </Typography>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress color="inherit" />
        </Box>
      );
    }

    if (error) {
      return (
        <Card sx={{ mt: 3, ...cardStyle }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      );
    }

    if (!data) {
      return null;
    }

    switch (reportType) {
      case "dealer-performance":
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <DashboardCard title="Total Dealers" value={data.length || data.dealers?.length || 0} />
              </Grid>
              <Grid item xs={12} md={4}>
                <DashboardCard title="Total Sales" value={`₹${(Array.isArray(data) ? data.reduce((s, d) => s + (d.totalSales || 0), 0) : data.totalSales) || 0}`} />
              </Grid>
              <Grid item xs={12} md={4}>
                <DashboardCard title="Pending Orders" value={`${data.pendingOrders || 0}`} />
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ p: 1, ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="#9fb6d9">Dealer-wise Sales</Typography>
                    <div style={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dealerPerformanceChartData}>
                          <XAxis dataKey="name" tick={{ fill: "#cfe9ff" }} />
                          <YAxis tick={{ fill: "#cfe9ff" }} />
                          <Tooltip />
                          <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ p: 1, ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="#9fb6d9">Product Group Sales</Typography>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries((data[0]?.productGroups || data[0]?.productGroups) || (data.productGroups || {})).map(([k, v]) => ({ name: k, value: v }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={80}
                            label
                          >
                            {Object.entries((data[0]?.productGroups || data.productGroups || {})).map(([,], i) => (
                              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case "account-statement":
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="#9fb6d9">Opening Balance</Typography>
                    <Typography variant="h6">₹{data.openingBalance || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="#9fb6d9">Closing Balance</Typography>
                    <Typography variant="h6">₹{data.closingBalance || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="#9fb6d9">Total Debit</Typography>
                    <Typography variant="h6">₹{data.totalDebit || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="#9fb6d9">Total Credit</Typography>
                    <Typography variant="h6">₹{data.totalCredit || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ mt: 2, ...cardStyle }}>
                  <CardContent>
                    <Typography variant="h6" color="#9fb6d9">Statements</Typography>
                    <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#071028" }}>
                            <th style={{ padding: 10 }}>Date</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.statements || []).map((s) => (
                            <tr key={s.id} style={{ borderBottom: "1px solid #1f2937" }}>
                              <td style={{ padding: 8 }}>{new Date(s.statementDate).toLocaleDateString()}</td>
                              <td>{s.description || s.documentType || "—"}</td>
                              <td>₹{s.debitAmount}</td>
                              <td>₹{s.creditAmount}</td>
                              <td>₹{s.balance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case "invoice-register":
        return (
          <Box sx={{ mt: 3 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Typography variant="h6" color="#9fb6d9">Invoice Register</Typography>
                <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#071028" }}>
                        <th style={{ padding: 10 }}>Invoice #</th>
                        <th>Date</th>
                        <th>Dealer</th>
                        <th>Product Group</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.invoices || []).map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #1f2937" }}>
                          <td style={{ padding: 8 }}>{inv.invoiceNumber}</td>
                          <td>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}</td>
                          <td>{inv.dealer?.businessName || "N/A"}</td>
                          <td>{inv.productGroup || "—"}</td>
                          <td>₹{inv.totalAmount}</td>
                          <td style={{ color: inv.status === "Paid" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{inv.status}</td>
                          <td>
                            <Button variant="outlined" size="small" sx={{ color: "#60a5fa", borderColor: "#60a5fa", textTransform: "none" }} onClick={() => downloadInvoicePDF(inv.id)}>Download PDF</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Box>
        );

      case "credit-debit-notes":
        return (
          <Box sx={{ mt: 3 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Typography variant="h6" color="#9fb6d9">Credit & Debit Notes</Typography>
                <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#071028" }}>
                        <th style={{ padding: 10 }}>Note #</th>
                        <th>Date</th>
                        <th>Dealer</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.notes || []).map((n) => (
                        <tr key={n.id} style={{ borderBottom: "1px solid #1f2937" }}>
                          <td style={{ padding: 8 }}>{n.noteNumber}</td>
                          <td>{n.noteDate ? new Date(n.noteDate).toLocaleDateString() : "—"}</td>
                          <td>{n.dealer?.businessName || "N/A"}</td>
                          <td style={{ textTransform: "capitalize" }}>{n.noteType}</td>
                          <td>₹{n.amount}</td>
                          <td>{n.reasonCode || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Card sx={{ p: 1, flex: 1, ...cardStyle }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="#9fb6d9">Total Credit</Typography>
                      <Typography variant="h6">₹{data.totalCredit || 0}</Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ p: 1, flex: 1, ...cardStyle }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="#9fb6d9">Total Debit</Typography>
                      <Typography variant="h6">₹{data.totalDebit || 0}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case "outstanding-receivables":
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="#9fb6d9">Total Outstanding</Typography>
                    <Typography variant="h5">₹{data.totalOutstanding || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="#9fb6d9">Aging</Typography>
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={outstandingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {outstandingPieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ ...cardStyle }}>
                  <CardContent>
                    <Typography variant="h6" color="#9fb6d9">Invoices</Typography>
                    <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#071028" }}>
                            <th style={{ padding: 10 }}>Invoice #</th>
                            <th>Dealer</th>
                            <th>Due Date</th>
                            <th>Balance</th>
                            <th>Days Past Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.invoices || []).map((inv) => {
                            const daysPast = inv.dueDate ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                              <tr key={inv.id} style={{ borderBottom: "1px solid #1f2937" }}>
                                <td style={{ padding: 8 }}>{inv.invoiceNumber}</td>
                                <td>{inv.dealer?.businessName || "N/A"}</td>
                                <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                                <td>₹{inv.balanceAmount}</td>
                                <td>{daysPast}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case "territory":
        return (
          <Box sx={{ mt: 3 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Typography variant="h6" color="#9fb6d9">Territory / Region Report</Typography>
                <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#071028" }}>
                        <th style={{ padding: 10 }}>Dealer Code</th>
                        <th>Business</th>
                        <th>State</th>
                        <th>Territory</th>
                        <th>Region</th>
                        <th>Total Sales</th>
                        <th>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.report || []).map((r) => (
                        <tr key={r.dealerCode || r.businessName} style={{ borderBottom: "1px solid #1f2937" }}>
                          <td style={{ padding: 8 }}>{r.dealerCode}</td>
                          <td>{r.businessName}</td>
                          <td>{r.state}</td>
                          <td>{r.territory}</td>
                          <td>{r.region}</td>
                          <td>₹{r.totalSales}</td>
                          <td>₹{r.outstanding}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Box>
        );

      case "admin-summary":
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DashboardCard title="Active Campaigns" value={data.activeCampaigns || 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <DashboardCard title="Total Dealers" value={data.totalDealers || 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <DashboardCard title="Blocked Dealers" value={data.blockedDealers || 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <DashboardCard title="Pending Documents" value={data.pendingDocuments || 0} />
              </Grid>
              <Grid item xs={12} md={3} sx={{ mt: 2 }}>
                <DashboardCard title="Pending Pricing" value={data.pendingPricing || 0} />
              </Grid>
              <Grid item xs={12} md={3} sx={{ mt: 2 }}>
                <DashboardCard title="Total Invoices" value={data.totalInvoices || 0} />
              </Grid>
              <Grid item xs={12} md={3} sx={{ mt: 2 }}>
                <DashboardCard title="Total Outstanding" value={`₹${data.totalOutstanding || 0}`} />
              </Grid>
            </Grid>
          </Box>
        );

      case "pending-approvals":
        return (
          <Box sx={{ mt: 3 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Typography variant="h6" color="#9fb6d9">Pending Approvals</Typography>
                <Divider sx={{ my: 1, borderColor: "#1f2937" }} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", color: "#e6eef8", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#071028" }}>
                        <th style={{ padding: 10 }}>ID</th>
                        <th>Dealer</th>
                        <th>Document Type</th>
                        <th>Created At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data || []).map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #1f2937" }}>
                          <td style={{ padding: 8 }}>{p.id}</td>
                          <td>{p.dealerName}</td>
                          <td>{p.documentType}</td>
                          <td>{new Date(p.createdAt).toLocaleString()}</td>
                          <td>{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return (
          <Card sx={{ mt: 3, ...cardStyle }}>
            <CardContent>
              <Typography>Report view not implemented yet.</Typography>
            </CardContent>
          </Card>
        );
    }
  };

  // UI filters area - keep compact and dynamic per report
  const renderFilters = () => {
    // show date range for most reports
    return (
      <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
        {/* Dealer Id */}
        <Grid item xs={12} sm={3} md={2}>
          <TextField
            name="dealerId"
            value={filters.dealerId}
            onChange={handleFilterChange}
            placeholder="Dealer ID"
            label="Dealer ID"
            size="small"
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <TextField
            name="productGroup"
            value={filters.productGroup}
            onChange={handleFilterChange}
            placeholder="Product Group"
            label="Product Group"
            size="small"
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <TextField
            name="invoiceNumber"
            value={filters.invoiceNumber}
            onChange={handleFilterChange}
            placeholder="Invoice #"
            label="Invoice #"
            size="small"
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <TextField
            type="date"
            name="startDate"
            label="From"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <TextField
            type="date"
            name="endDate"
            label="To"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <TextField
            select
            name="status"
            label="Status"
            value={filters.status}
            onChange={handleFilterChange}
            size="small"
            variant="filled"
            sx={{ background: "#0b1220", borderRadius: 1, "& .MuiFilledInput-root": { color: "#e6eef8" } }}
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Unpaid">Unpaid</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Delivered">Delivered</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ color: "#dbeafe", fontWeight: 700 }}>
            Reports Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#93c5fd" }}>
            Select a report, apply filters and generate beautiful manager-ready visuals.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            size="small"
            sx={{
              minWidth: 220,
              background: "#0b1220",
              "& .MuiInputBase-input": { color: "#e6eef8" },
              borderRadius: 1,
            }}
          >
            {REPORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" sx={{ bgcolor: "#2563eb" }} onClick={fetchReport} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </Button>

          <Button variant="outlined" sx={{ color: "#e6eef8", borderColor: "#2563eb" }} onClick={() => exportReport("pdf")} startIcon={<Download />} disabled={exporting}>
            PDF
          </Button>
          <Button variant="outlined" sx={{ color: "#e6eef8", borderColor: "#2563eb" }} onClick={() => exportReport("excel")} startIcon={<Download />} disabled={exporting}>
            Excel
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {renderFilters()}

      {/* Main Report Body */}
      {renderReportBody()}
    </Box>
  );
}
