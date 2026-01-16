import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Breadcrumbs,
  Link,
  Paper,
  alpha,
  useTheme,
  useMediaQuery,
  Grid
} from "@mui/material";
import {
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  ChevronRight,
  Home,
  BarChart3,
  FileText,
  PieChart,
  Search,
  ChevronLeft,
  Menu as MenuIcon
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import FiltersBar from "../pages/reports/FiltersBar";
import { getReportScopeExplanation, formatAppliedFilters, getDataFreshness, getExportClarity } from "../utils/reportScope";
import RegionalSalesSummary from "../pages/reports/RegionalSalesSummary";
import AdminSummary from "../pages/reports/AdminSummary";
import DealerPerformance from "../pages/reports/DealerPerformance";
import TerritorySummary from "../pages/reports/TerritorySummary";
import PendingApprovals from "../pages/reports/PendingApprovals";
import DynamicReportView from "./reports/DynamicReportView";

// Custom Imports (Fixing missing ones)
import AccountStatement from "./reports/AccountStatementReport";
import InvoiceRegister from "./reports/InvoiceRegister";
import CreditDebitNotes from "./reports/CreditDebitNotes";
import OutstandingReceivables from "./reports/OutstandingReceivables";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import api, { reportAPI } from "../services/api";
import { toast } from "react-toastify";

const NEW_REPORT_OPTIONS = [
  // Finance
  { value: "le-register", label: "Le Register (A/C Statement)", category: "Finance", hideOnMonthEnd: true },
  { value: "fi-daywise", label: "FI Daywise Report", category: "Finance" },
  { value: "drcr-note", label: "DR/CR Note Register", category: "Finance" },
  { value: "sales-register", label: "Sales Register", category: "Finance", hideOnMonthEnd: true },
  { value: "collection", label: "Collection Report", category: "Finance" },
  // Inventory
  { value: "stock-overview", label: "Stock Overview", category: "Inventory" },
  { value: "comparative", label: "Comparative Report (Plant vs Depot)", category: "Inventory" },
  { value: "compliance", label: "Compliance / Expiry Report", category: "Inventory" },
  { value: "rr-summary", label: "RR Summary Report", category: "Inventory" },
  // Rake
  { value: "rake-arrival", label: "Rake Arrival Report", category: "Rake" },
  { value: "rake-data", label: "Rake Arrival Data", category: "Rake" },
  { value: "rake-exception", label: "Consolidated Exception", category: "Rake" },
  { value: "rake-approval", label: "Rake Report Approval", category: "Rake" },
  // Technical
  { value: "diversion", label: "Diversion Report", category: "Technical" },
  { value: "dms-request", label: "DMS Order Request Log", category: "Technical" },
];

const REPORT_OPTIONS_BY_ROLE = {
  dealer: [
    { value: "dealer-performance", label: "Dealer Performance", category: "Analytics" },
    { value: "account-statement", label: "Account Statement", category: "Finance" },
    { value: "invoice-register", label: "Invoice Register", category: "Finance" },
    { value: "credit-debit-notes", label: "Credit/Debit Notes", category: "Finance" },
    { value: "outstanding-receivables", label: "Outstanding", category: "Finance" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Finance" || r.category === "Inventory")
  ],
  dealer_admin: [
    { value: "dealer-performance", label: "Dealer Performance", category: "Analytics" },
    { value: "account-statement", label: "Account Statement", category: "Finance" },
    { value: "invoice-register", label: "Invoice Register", category: "Finance" },
    { value: "credit-debit-notes", label: "Credit/Debit Notes", category: "Finance" },
    { value: "outstanding-receivables", label: "Outstanding", category: "Finance" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Finance" || r.category === "Inventory")
  ],
  super_admin: [
    { value: "admin-summary", label: "Admin Summary", category: "Overview" },
    { value: "regional-sales-summary", label: "Regional Sales", category: "Analytics" },
    { value: "territory", label: "Territory Overview", category: "Analytics" },
    { value: "pending-approvals", label: "Pending Tasks", category: "Workflows" },
    ...NEW_REPORT_OPTIONS
  ],
  regional_admin: [
    { value: "regional-sales-summary", label: "Regional Sales", category: "Analytics" },
    { value: "territory", label: "Territory Overview", category: "Analytics" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Finance" || r.category === "Inventory")
  ],
  finance_admin: [
    { value: "account-statement", label: "Account Statement", category: "Finance" },
    { value: "invoice-register", label: "Invoice Register", category: "Finance" },
    { value: "credit-debit-notes", label: "Credit/Debit Notes", category: "Finance" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Finance")
  ],
  accounts_user: [
    { value: "account-statement", label: "Account Statement", category: "Finance" },
    { value: "invoice-register", label: "Invoice Register", category: "Finance" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Finance")
  ],
  regional_manager: [
    { value: "regional-sales-summary", label: "Regional Sales", category: "Analytics" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Rake")
  ],
  regional_head: [
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Rake")
  ],
  cfa: [
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Rake")
  ],
  technical_admin: [
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Technical")
  ],
  area_manager: [
    { value: "territory", label: "Territory Summary", category: "Analytics" },
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Inventory")
  ],
  territory_manager: [
    ...NEW_REPORT_OPTIONS.filter(r => r.category === "Inventory")
  ]
};

export default function Reports() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const role = user?.role || "dealer";

  const [reportType, setReportType] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
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
  const [scopeExplanationOpen, setScopeExplanationOpen] = useState(false);
  const [filtersExplanationOpen, setFiltersExplanationOpen] = useState(false);

  // Month-end closing logic
  const isMonthEnd = useMemo(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return today.getDate() > (lastDayOfMonth - 3);
  }, []);

  const allowedReports = useMemo(() => {
    let reports = REPORT_OPTIONS_BY_ROLE[role] || [];
    if (isMonthEnd) {
      reports = reports.filter(r => !r.hideOnMonthEnd);
    }
    return reports;
  }, [role, isMonthEnd]);

  // Handle URL query params for report type
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (type) {
      const isAllowed = allowedReports.some(r => r.value === type);
      if (isAllowed) {
        setReportType(type);
      } else {
        const defaultType = allowedReports.length > 0 ? allowedReports[0].value : "";
        setReportType(defaultType);
        if (isMonthEnd && NEW_REPORT_OPTIONS.find(r => r.value === type)?.hideOnMonthEnd) {
          toast.info("This report is locked during month-end closing");
        }
      }
    } else if (allowedReports.length > 0 && !reportType) {
      setReportType(allowedReports[0].value);
    }
  }, [location.search, allowedReports]);

  const handleFiltersChange = (next) => setFilters((p) => ({ ...p, ...next }));

  const fetchReport = async (opts = {}) => {
    if (!reportType) return;
    setError("");
    setLoading(true);
    try {
      const params = { ...filters, ...opts };
      let data;
      switch (reportType) {
        case "dealer-performance": data = await reportAPI.getDealerPerformance(params); break;
        case "regional-sales-summary": data = await reportAPI.getRegionalSales(params); break;
        case "territory": data = await reportAPI.getTerritoryReport(params); break;
        case "account-statement": data = await reportAPI.getAccountStatement(params); break;
        case "invoice-register": data = await reportAPI.getInvoiceRegister(params); break;
        case "credit-debit-notes": data = await reportAPI.getCreditDebitNotes(params); break;
        case "outstanding-receivables": data = await reportAPI.getOutstandingReceivables(params); break;
        case "pending-approvals": data = await reportAPI.getPendingApprovals(params); break;
        case "admin-summary": data = await reportAPI.getAdminSummary(params); break;
        case "le-register": data = await reportAPI.getLERegister(params); break;
        case "fi-daywise": data = await reportAPI.getFIDaywise(params); break;
        case "drcr-note": data = await reportAPI.getDRCRNoteRegister(params); break;
        case "sales-register": data = await reportAPI.getSalesRegister(params); break;
        case "collection": data = await reportAPI.getCollectionReport(params); break;
        case "stock-overview": data = await reportAPI.getStockOverview(params); break;
        case "comparative": data = await reportAPI.getComparativeReport(params); break;
        case "compliance": data = await reportAPI.getComplianceReport(params); break;
        case "rr-summary": data = await reportAPI.getRRSummary(params); break;
        case "rake-arrival": data = await reportAPI.getRakeArrivalReport(params); break;
        case "rake-data": data = await reportAPI.getRakeArrivalData(params); break;
        case "rake-exception": data = await reportAPI.getConsolidatedException(params); break;
        case "rake-approval": data = await reportAPI.getRakeApproval(params); break;
        case "diversion": data = await reportAPI.getDiversionReport(params); break;
        case "dms-request": data = await reportAPI.getDMSOrderRequests(params); break;
        default: throw new Error(`Unknown report type: ${reportType}`);
      }
      setData(data);
      setDataFetchedAt(new Date().toISOString());
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        toast.error("Resource locked or unavailable for your role.");
        setReportType("");
        setData(null);
        setError("Report not available");
      } else {
        setError(err.response?.data?.error || err.message || "Failed to fetch report");
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
      if (format === "pdf") blob = await reportAPI.exportPDF(reportType, params);
      else blob = await reportAPI.exportExcel(reportType, params);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Centralized Data Transformation to avoid Hook Rules Violation
  const transformedData = useMemo(() => {
    if (!data) return null;

    // FI Daywise Transformation
    if (reportType === "fi-daywise" && (data.invoices || data.payments)) {
      const dates = new Set([
        ...(data.invoices || []).map(i => i.date),
        ...(data.payments || []).map(p => p.date)
      ]);

      return Array.from(dates).map(date => {
        const inv = (data.invoices || []).find(i => i.date === date);
        const pmt = (data.payments || []).find(p => p.date === date);
        return {
          date,
          sales: inv ? inv.totalSales : 0,
          collection: pmt ? pmt.totalCollection : 0
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // RR Summary Transformation
    if (reportType === "rr-summary" && data.receipts) {
      return data.receipts.map(r => ({
        ...r,
        rrNo: r.rrNumber,
        date: r.rrDate ? r.rrDate.split('T')[0] : r.rrDate,
        status: r.status || 'Received'
      }));
    }

    // Stock Overview Transformation
    if (reportType === "stock-overview" && data.inventory) {
      return data.inventory.map(item => ({
        ...item,
        material: item.name || item.materialNumber // Map name to material column
      }));
    }

    // Compliance/Expiry Transformation
    if (reportType === "compliance" && (data.expringSoon || data.expiringSoon)) {
      return (data.expringSoon || data.expiringSoon).map(item => ({
        ...item,
        material: item.name,
        code: item.materialNumber,
        expiry: item.expiryDate ? item.expiryDate.split('T')[0] : 'N/A'
      }));
    }

    // Sales Register Transformation
    if (reportType === "sales-register" && data.invoices) {
      return data.invoices.map(inv => ({
        ...inv,
        invNo: inv.invoiceNumber,
        date: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : inv.invoiceDate,
        amount: inv.totalAmount
      }));
    }

    // Collection Report Transformation
    if (reportType === "collection" && data.collections) {
      return data.collections.map(c => ({
        ...c,
        receiptNo: c.transactionId || c.id.substring(0, 8).toUpperCase(),
        date: c.createdAt ? c.createdAt.split('T')[0] : c.createdAt,
        amount: c.amount
      }));
    }

    return data;
  }, [data, reportType]);

  const renderCurrentReport = () => {
    const commonProps = { data: transformedData, loading, error, fetchReport, filters, role };
    switch (reportType) {
      case "dealer-performance": return <DealerPerformance {...commonProps} />;
      case "account-statement": return <AccountStatement {...commonProps} />;
      case "invoice-register": return <InvoiceRegister {...commonProps} />;
      case "credit-debit-notes": return <CreditDebitNotes {...commonProps} />;
      case "outstanding-receivables": return <OutstandingReceivables {...commonProps} />;
      case "regional-sales-summary": return <RegionalSalesSummary {...commonProps} />;
      case "territory": return <TerritorySummary {...commonProps} />;
      case "pending-approvals": return <PendingApprovals {...commonProps} />;
      case "admin-summary": return <AdminSummary {...commonProps} />;
      case "le-register": return <DynamicReportView title="Le Register" columns={[{ field: 'date', headerName: 'Date' }, { field: 'desc', headerName: 'Description' }, { field: 'amount', headerName: 'Amount' }]} {...commonProps} />;
      case "fi-daywise":
        return <DynamicReportView title="FI Daywise Report" columns={[{ field: 'date', headerName: 'Date' }, { field: 'sales', headerName: 'Sales' }, { field: 'collection', headerName: 'Collection' }]} {...commonProps} />;
      case "drcr-note": return <DynamicReportView title="DR/CR Note Register" columns={[{ field: 'noteNo', headerName: 'Note #' }, { field: 'date', headerName: 'Date' }, { field: 'amount', headerName: 'Amount' }]} {...commonProps} />;
      case "sales-register": return <DynamicReportView title="Sales Register" columns={[{ field: 'invNo', headerName: 'Inv #' }, { field: 'date', headerName: 'Date' }, { field: 'amount', headerName: 'Amount' }]} {...commonProps} />;
      case "collection": return <DynamicReportView title="Collection Report" columns={[{ field: 'receiptNo', headerName: 'Receipt #' }, { field: 'date', headerName: 'Date' }, { field: 'amount', headerName: 'Amount' }]} {...commonProps} />;
      case "stock-overview": return <DynamicReportView title="Stock Overview" columns={[{ field: 'material', headerName: 'Material' }, { field: 'stock', headerName: 'Stock Qty' }, { field: 'plant', headerName: 'Plant' }]} {...commonProps} />;
      case "comparative":
        return (
          <Box>
            <DynamicReportView title="Comparative Report" columns={[{ field: 'category', headerName: 'Category' }, { field: 'plantStock', headerName: 'Plant Stock' }, { field: 'depotStock', headerName: 'Depot Stock' }]} {...commonProps} />
            {data && <Paper sx={{ p: 3, mt: 2, borderRadius: 4 }} elevation={0} variant="outlined">
              <Typography variant="h6" fontWeight="bold" gutterBottom>Visual Analysis</Typography>
              <Box height={300}><ResponsiveContainer><BarChart data={Array.isArray(data.data) ? data.data : data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="category" /><YAxis /><Tooltip /><Legend /><Bar dataKey="plantStock" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} /><Bar dataKey="depotStock" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Box>
            </Paper>}
          </Box>
        );
      case "compliance": return <DynamicReportView title="Expiry / Compliance Report" columns={[{ field: 'material', headerName: 'Material' }, { field: 'code', headerName: 'Code' }, { field: 'expiry', headerName: 'Expiry Date' }]} {...commonProps} />;
      case "rr-summary":
        return <DynamicReportView title="RR Summary" columns={[{ field: 'rrNo', headerName: 'RR #' }, { field: 'date', headerName: 'Date' }, { field: 'status', headerName: 'Status' }]} {...commonProps} />;
      case "rake-arrival": return <DynamicReportView title="Rake Arrival" columns={[{ field: 'rakeId', headerName: 'Rake ID' }, { field: 'status', headerName: 'Status' }]} {...commonProps} />;
      case "rake-data": return <DynamicReportView title="Rake Data" columns={[{ field: 'wagonNo', headerName: 'Wagon' }, { field: 'material', headerName: 'Material' }]} {...commonProps} />;
      case "rake-exception": return <DynamicReportView title="Exceptions" columns={[{ field: 'issue', headerName: 'Issue' }, { field: 'severity', headerName: 'Severity' }]} {...commonProps} />;
      case "rake-approval": return <DynamicReportView title="Approvals" columns={[{ field: 'reportId', headerName: 'Report' }, { field: 'status', headerName: 'Status' }]} {...commonProps} />;
      case "diversion": return <DynamicReportView title="Diversion" columns={[{ field: 'orderId', headerName: 'Order' }, { field: 'newDest', headerName: 'Destination' }]} {...commonProps} />;
      case "dms-request": return <DynamicReportView title="DMS Request" columns={[{ field: 'reqId', headerName: 'ID' }, { field: 'status', headerName: 'Status' }]} {...commonProps} />;
      default: return <Box textAlign="center" py={10}><Typography color="text.secondary">Select a report to begin analysis</Typography></Box>;
    }
  };

  const scopeExplanation = getReportScopeExplanation(user);
  const appliedFilters = formatAppliedFilters(filters);
  const dataFreshness = getDataFreshness(data, dataFetchedAt);

  const reportsByCategory = useMemo(() => {
    const cats = {};
    allowedReports.forEach(r => {
      const c = r.category || "General";
      if (!cats[c]) cats[c] = [];
      cats[c].push(r);
    });
    return cats;
  }, [allowedReports]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Report Explorer Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}><BarChart3 size={20} /></Box>
          <Typography variant="h6" fontWeight="900">Explorer</Typography>
        </Box>
        <Divider />
        <Box sx={{ overflowY: 'auto', p: 1 }}>
          {Object.entries(reportsByCategory).map(([cat, reports]) => (
            <Box key={cat} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ px: 2, fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {cat}
              </Typography>
              <List dense>
                {reports.map((r) => (
                  <ListItem key={r.value} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={reportType === r.value}
                      onClick={() => {
                        setReportType(r.value);
                        navigate(`/reports?type=${r.value}`);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: reportType === r.value ? 'primary.main' : 'inherit' }}>
                        <FileText size={16} />
                      </ListItemIcon>
                      <ListItemText
                        primary={r.label}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: reportType === r.value ? 700 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, transition: 'margin 0.3s', ml: sidebarOpen && !isMobile ? 0 : 0 }}>
        {/* Navigation & Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              {sidebarOpen ? <ChevronLeft size={20} /> : <MenuIcon size={20} />}
            </IconButton>
            <Breadcrumbs separator={<ChevronRight size={14} />}>
              <Link underline="hover" color="inherit" onClick={() => navigate('/reports/overview')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Home size={16} style={{ marginRight: 8 }} /> Hub
              </Link>
              <Typography color="text.primary" sx={{ fontWeight: 700 }}>
                {allowedReports.find(r => r.value === reportType)?.label || "Report"}
              </Typography>
            </Breadcrumbs>
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: -1 }}>
                {allowedReports.find(r => r.value === reportType)?.label || "Select Report"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analytics engine for <span style={{ fontWeight: 700, color: theme.palette.text.primary }}>{role.replace(/_/g, ' ').toUpperCase()}</span>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', lg: 'auto' } }}>
              <FiltersBar
                reportOptions={allowedReports}
                reportType={reportType}
                setReportType={setReportType}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onGenerate={() => fetchReport()}
                loading={loading}
              />
              <Button variant="contained" disabled={exporting} onClick={() => exportReport("pdf")}
                sx={{ borderRadius: 3, px: 3, bgcolor: 'text.primary', '&:hover': { bgcolor: 'black' } }}>
                Export
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Intelligence Context Panel */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.info.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={() => setScopeExplanationOpen(!scopeExplanationOpen)} sx={{ cursor: 'pointer' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Info size={18} color={theme.palette.info.main} />
                    <Typography variant="subtitle2" fontWeight="700">Governance Scope</Typography>
                  </Stack>
                  {scopeExplanationOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Stack>
                <Collapse in={scopeExplanationOpen}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="700" color="info.main">{scopeExplanation.scope}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>{scopeExplanation.explanation}</Typography>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <RefreshCw size={18} color={theme.palette.success.main} className={loading ? 'animate-spin' : ''} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700">Data Freshness</Typography>
                      <Typography variant="caption" color="text.secondary">{dataFreshness.label}</Typography>
                    </Box>
                  </Stack>
                  <Button size="small" onClick={() => fetchReport()} sx={{ fontWeight: 800 }}>Refresh</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Report Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={reportType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderCurrentReport()}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
