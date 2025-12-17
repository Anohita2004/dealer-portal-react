// src/pages/reports/Reports.jsx
import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button, Chip, Alert, Card, CardContent, Collapse, IconButton, Stack } from "@mui/material";
import { Download, Info, ExpandMore, ExpandLess, Refresh as RefreshIcon, Filter } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import FiltersBar from "../pages/reports/FiltersBar";
import { getReportScopeExplanation, formatAppliedFilters, getDataFreshness, getExportClarity } from "../utils/reportScope";
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
import { toast } from "react-toastify";

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
  accounts_user: [
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
  ],
  finance_admin: [
    { value: "account-statement", label: "Account Statement" },
    { value: "invoice-register", label: "Invoice Register" },
    { value: "credit-debit-notes", label: "Credit / Debit Notes" },
    { value: "outstanding-receivables", label: "Outstanding Receivables" },
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
  const [dataFetchedAt, setDataFetchedAt] = useState(null);
  const [scopeExplanationOpen, setScopeExplanationOpen] = useState(true);
  const [filtersExplanationOpen, setFiltersExplanationOpen] = useState(true);

  // choose sensible default based on role permissions
  useEffect(() => {
    const allowedReports = REPORT_OPTIONS_BY_ROLE[role] || [];
    if (allowedReports.length > 0) {
      setReportType(allowedReports[0].value);
    } else {
      setReportType("");
    }
  }, [role]);

  // Handle URL query params for report type
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type) {
      // Guard against admin-only reports for Accounts role
      const allowedReports = REPORT_OPTIONS_BY_ROLE[role] || [];
      const isAllowed = allowedReports.some(r => r.value === type);
      if (isAllowed) {
        setReportType(type);
      } else if (type && !isAllowed) {
        // If report type not allowed, set to first available or empty
        const defaultType = allowedReports.length > 0 ? allowedReports[0].value : "";
        setReportType(defaultType);
        toast.error("This report is not available for your role");
      }
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
          // Guard: Only allow for roles that have this in REPORT_OPTIONS_BY_ROLE
          if (!REPORT_OPTIONS_BY_ROLE[role]?.some(r => r.value === "pending-approvals")) {
            toast.error("This report is not available for your role");
            setReportType("");
            setLoading(false);
            return;
          }
          data = await reportAPI.getPendingApprovals(params);
          break;
        case "admin-summary":
          // Guard: Only allow for super_admin
          if (role !== "super_admin" && role !== "admin") {
            toast.error("This report is only available for Super Admin");
            setReportType("");
            setLoading(false);
            return;
          }
          data = await reportAPI.getAdminSummary(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      setData(data);
      setDataFetchedAt(new Date().toISOString());
    } catch (err) {
      // 404/403 = endpoint doesn't exist or role restriction
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        toast.error("This report is not available for your role");
        setReportType("");
        setData(null);
        setError("Report not available");
      } else {
        console.error("fetchReport:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch report. See console.");
        setData(null);
      }
      setDataFetchedAt(null);
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

  // Get scope explanation
  const scopeExplanation = getReportScopeExplanation(user);
  
  // Get applied filters
  const appliedFilters = formatAppliedFilters(filters);
  
  // Get data freshness
  const dataFreshness = getDataFreshness(data, dataFetchedAt);
  
  // Get export clarity
  const exportClarity = getExportClarity(reportType, filters, scopeExplanation, "excel");

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

      {/* Role-Based Scope Explanation - Backend Intelligence */}
      <Alert 
        severity="info" 
        icon={<Info />}
        sx={{ mb: 2 }}
        action={
          <IconButton
            size="small"
            onClick={() => setScopeExplanationOpen(!scopeExplanationOpen)}
          >
            {scopeExplanationOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Report Scope: {scopeExplanation.scope}
        </Typography>
        <Collapse in={scopeExplanationOpen}>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {scopeExplanation.explanation}
          </Typography>
        </Collapse>
      </Alert>

      {/* Applied Filters - Backend Intelligence */}
      {appliedFilters.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Filter size={18} />
                Applied Filters
              </Typography>
              <IconButton
                size="small"
                onClick={() => setFiltersExplanationOpen(!filtersExplanationOpen)}
              >
                {filtersExplanationOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={filtersExplanationOpen}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {appliedFilters.map((filter, idx) => (
                  <Chip
                    key={idx}
                    label={`${filter.label}: ${filter.value}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Data Freshness Indicator - Backend Intelligence */}
      {data && dataFetchedAt && (
        <Alert 
          severity={dataFreshness.color === "success" ? "success" : dataFreshness.color === "warning" ? "warning" : "error"}
          icon={<RefreshIcon />}
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => fetchReport()}>
              Refresh
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Data Freshness: {dataFreshness.label}
          </Typography>
          <Typography variant="caption">
            {dataFreshness.description}
          </Typography>
        </Alert>
      )}

      {/* Export Clarity - Backend Intelligence */}
      {data && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Export Information
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {exportClarity.description}
            </Typography>
            {exportClarity.includes.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Export includes:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {exportClarity.includes.map((item, idx) => (
                    <Typography key={idx} component="li" variant="caption" color="text.secondary">
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            {exportClarity.excludes.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Export excludes:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {exportClarity.excludes.map((item, idx) => (
                    <Typography key={idx} component="li" variant="caption" color="text.secondary">
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {renderCurrentReport()}
    </Box>
  );
}
