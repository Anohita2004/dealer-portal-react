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

import api, { reportAPI } from "../services/api";

const REPORT_OPTIONS_BY_ROLE = {
  dealer: [
    { value: "dealer-performance", label: "Dealer Performance" },
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
  ],
  dealer_admin: [
    { value: "dealer-performance", label: "Dealer Performance" },
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
  ],
  dealer_staff: [
    { value: "dealer-performance", label: "Dealer Performance" },
    { value: "account-statement", label: "Account Statement" },
  ],
  territory_manager: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
  ],
  area_manager: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Area-Wise Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
  ],
  regional_manager: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
  ],
  regional_admin: [
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
    { value: "dealer-performance", label: "Dealer Performance" },
  ],
  super_admin: [
    { value: "admin-summary", label: "Admin Summary" },
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory Summary" },
    { value: "pending-approvals", label: "Pending Approvals" },
    { value: "dealer-performance", label: "Dealer Performance" },
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
  ],
  admin: [
    { value: "admin-summary", label: "Admin Summary" },
    { value: "regional-sales-summary", label: "Regional Sales Summary" },
    { value: "territory", label: "Territory Summary" },
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
    if (role === "dealer" || role === "dealer_admin" || role === "dealer_staff") {
      setReportType("dealer-performance");
    } else if (role === "super_admin" || role === "admin") {
      setReportType("admin-summary");
    } else {
      setReportType("regional-sales-summary");
    }
  }, [role]);

  const handleFiltersChange = (next) => setFilters((p) => ({ ...p, ...next }));

  const fetchReport = async (opts = {}) => {
    if (!reportType) return;
    setError("");
    setLoading(true);
    try {
      const params = { ...filters, ...opts };
      
      // Map report types to API methods
      let data;
      switch (reportType) {
        case "dealer-performance":
          data = await reportAPI.getDealerPerformance(params);
          break;
        case "regional-sales-summary":
          data = await reportAPI.getRegionalSales(params);
          break;
        case "territory":
          data = await reportAPI.getTerritoryReport(params);
          break;
        case "account-statement":
          data = await reportAPI.getAccountStatement(params);
          break;
        case "invoice-register":
          data = await reportAPI.getInvoiceRegister(params);
          break;
        case "credit-debit-notes":
          data = await reportAPI.getCreditDebitNotes(params);
          break;
        case "outstanding-receivables":
          data = await reportAPI.getOutstandingReceivables(params);
          break;
        case "pending-approvals":
          data = await reportAPI.getPendingApprovals(params);
          break;
        case "admin-summary":
          data = await reportAPI.getAdminSummary(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      setData(data);
    } catch (err) {
      console.error("fetchReport:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch report. See console.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = "pdf") => {
    if (!reportType) return;
    setExporting(true);
    try {
      const params = { ...filters, format };
      let blob;
      
      if (format === "pdf") {
        blob = await reportAPI.exportPDF(reportType, params);
      } else {
        blob = await reportAPI.exportExcel(reportType, params);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("exportReport:", err);
      setError(err.response?.data?.error || "Export failed. See console.");
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
            reportOptions={REPORT_OPTIONS_BY_ROLE[role] || REPORT_OPTIONS_BY_ROLE["super_admin"] || REPORT_OPTIONS_BY_ROLE["admin"]}
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
