// src/pages/reports/Reports.jsx
import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Download } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import FiltersBar from "../pages/reports/FiltersBar";
import RegionalSalesSummary from "../pages/reports/RegionalSalesSummary";
import AdminSummary from "../pages/reports/AdminSummary";
import DealerPerformance from "../pages/reports/DealerPerformance";
import TerritorySummary from "../pages/reports/TerritorySummary";
import DealerTable from "../pages/reports/DealerTable";
import ChartsBlock from "../pages/reports/ChartsBlock";
import KPISection from "../pages/reports/KPISection";
//import PendingApprovals from "../pages/reports/PendingApprovals";
//import DealerReport from "../pages/reports/DealerReport";
import AccountStatement from "../pages/reports/AccountStatementReport";
import InvoiceRegister from "../pages/reports/InvoiceRegister";
import CreditDebitNotes from "../pages/reports/CreditDebitNotes";
import OutstandingReceivables from "../pages/reports/OutstandingReceivables";
import PendingApprovals from "../pages/reports/PendingApprovals";

import api from "../services/api";

const REPORT_OPTIONS_BY_ROLE = {
  dealer: [
    { value: "dealer-performance", label: "Dealer Performance" },
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
  ],
  tm: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory / Region Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
  ],
  am: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Area-Wise Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
  ],
  admin: [
    { value: "admin-summary", label: "Admin Summary" },
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Regional Sales Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
    { value: "dealer-performance", label: "Dealer Performance" }
  ],
};

export default function Reports() {
  const { user } = useContext(AuthContext);
  const role = user?.role || "dealer";

  const [reportType, setReportType] = useState("");
  const [filters, setFilters] = useState({
    region: "",
    territory: "",
    dealerId: "",
    startDate: "",
    endDate: "",
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // choose sensible default
  useEffect(() => {
    if (role === "dealer") setReportType("dealer-performance");
    else if (role === "admin") setReportType("admin-summary");
    else setReportType("regional-sales-summary");
  }, [role]);

  const handleFiltersChange = (next) => setFilters((p) => ({ ...p, ...next }));

  const fetchReport = async (opts = {}) => {
    if (!reportType) return;
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, ...opts }).toString();
      const res = await api.get(`/reports/${reportType}${params ? `?${params}` : ""}`);
      setData(res.data);
    } catch (err) {
      console.error("fetchReport:", err);
      setError("Failed to fetch report. See console.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = "pdf") => {
    if (!reportType) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ ...filters, format }).toString();
      const res = await api.get(`/reports/${reportType}?${params}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: format === "pdf" ? "application/pdf" : "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("exportReport:", err);
      setError("Export failed. See console.");
    } finally {
      setExporting(false);
    }
  };

 const renderCurrentReport = () => {
  const commonProps = { data, loading, error, fetchReport, filters, role };

  switch (reportType) {
    /** ============================
     *  DEALER REPORTS
     * ============================*/
    case "dealer-performance":
      return <DealerPerformance {...commonProps} />;

    case "account-statement":
      return <AccountStatement {...commonProps} />;

    case "invoice-register":
      return <InvoiceRegister {...commonProps} />;

    case "credit-debit-notes":
      return <CreditDebitNotes {...commonProps} />;

    case "outstanding-receivables":
      return <OutstandingReceivables {...commonProps} />;

    /** ============================
     *  MANAGER / TM / AM REPORTS
     * ============================*/
    case "regional-sales-summary":
      return <RegionalSalesSummary {...commonProps} />;

    case "territory":
      return <TerritorySummary {...commonProps} />;

    case "pending-approvals":
  return <PendingApprovals {...commonProps} />;


    /** ============================
     *  ADMIN REPORTS
     * ============================*/
    case "admin-summary":
      return <AdminSummary {...commonProps} />;

    /** ============================
     *  FALLBACK
     * ============================*/
    default:
      return (
        <div style={{ marginTop: 24 }}>
          Select a report and click Generate.
        </div>
      );
  }
};

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Reports Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role: {role?.toUpperCase()} — choose a report and apply filters
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <FiltersBar
            reportOptions={REPORT_OPTIONS_BY_ROLE[role] || REPORT_OPTIONS_BY_ROLE["admin"]}
            reportType={reportType}
            setReportType={setReportType}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onGenerate={() => fetchReport()}
            loading={loading}
          />

          <Button variant="outlined" startIcon={<Download />} onClick={() => exportReport("pdf")} disabled={exporting}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={() => exportReport("excel")} disabled={exporting}>
            Excel
          </Button>
        </Box>
      </Box>

      {renderCurrentReport()}
    </Box>
  );
}
