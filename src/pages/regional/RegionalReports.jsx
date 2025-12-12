import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  reportAPI,
  dealerAPI,
  invoiceAPI,
  orderAPI,
  campaignAPI,
  inventoryAPI,
  taskAPI,
  paymentAPI,
  userAPI,
} from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";

export default function RegionalReports() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Report data states
  const [salesData, setSalesData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [invoicesData, setInvoicesData] = useState([]);
  const [dealersData, setDealersData] = useState([]);
  const [managersData, setManagersData] = useState([]);
  const [territoryPerformance, setTerritoryPerformance] = useState([]);
  const [campaignPerformance, setCampaignPerformance] = useState([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [orderPipelines, setOrderPipelines] = useState([]);

  useEffect(() => {
    loadReportData();
  }, [activeTab, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      switch (activeTab) {
        case 0: // Sales
          await loadSalesData(params);
          break;
        case 1: // Outstanding
          await loadOutstandingData(params);
          break;
        case 2: // Invoices
          await loadInvoicesData(params);
          break;
        case 3: // Dealers
          await loadDealersData();
          break;
        case 4: // Managers
          await loadManagersData();
          break;
        case 5: // Territory Performance
          await loadTerritoryPerformance(params);
          break;
        case 6: // Campaign Performance
          await loadCampaignPerformance();
          break;
        case 7: // Inventory
          await loadInventoryData();
          break;
        case 8: // Overdue Tasks/Payments
          await loadOverdueData();
          break;
        case 9: // Order Pipelines
          await loadOrderPipelines(params);
          break;
      }
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async (params) => {
    try {
      const data = await reportAPI.getRegionalSales(params);
      setSalesData(data);
    } catch (error) {
      console.error("Failed to load sales data:", error);
    }
  };

  const loadOutstandingData = async (params) => {
    try {
      const data = await reportAPI.getOutstandingReceivables(params);
      setOutstandingData(data);
    } catch (error) {
      console.error("Failed to load outstanding data:", error);
    }
  };

  const loadInvoicesData = async (params) => {
    try {
      const data = await invoiceAPI.getInvoices(params);
      setInvoicesData(data.data || data || []);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    }
  };

  const loadDealersData = async () => {
    try {
      const data = await dealerAPI.getDealers();
      setDealersData(data.data || data || []);
    } catch (error) {
      console.error("Failed to load dealers:", error);
    }
  };

  const loadManagersData = async () => {
    try {
      const data = await userAPI.getUsers({ role: "area_manager,territory_manager,regional_manager" });
      setManagersData(data.data || data.users || data || []);
    } catch (error) {
      console.error("Failed to load managers:", error);
    }
  };

  const loadTerritoryPerformance = async (params) => {
    try {
      const data = await reportAPI.getTerritoryReport(params);
      setTerritoryPerformance(data.data || data || []);
    } catch (error) {
      console.error("Failed to load territory performance:", error);
    }
  };

  const loadCampaignPerformance = async () => {
    try {
      const data = await campaignAPI.getCampaigns();
      const campaigns = data.data || data || [];
      // Load analytics for each campaign
      const performanceData = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const analytics = await campaignAPI.getCampaignAnalytics(campaign.id);
            return { ...campaign, analytics };
          } catch (e) {
            return { ...campaign, analytics: null };
          }
        })
      );
      setCampaignPerformance(performanceData);
    } catch (error) {
      console.error("Failed to load campaign performance:", error);
    }
  };

  const loadInventoryData = async () => {
    try {
      const data = await inventoryAPI.getSummary();
      setInventoryData(data);
    } catch (error) {
      console.error("Failed to load inventory data:", error);
    }
  };

  const loadOverdueData = async () => {
    try {
      const [tasksData, paymentsData] = await Promise.all([
        taskAPI.getTasks(),
        paymentAPI.getAllPayments({ status: "overdue" }),
      ]);
      setOverdueTasks(tasksData.tasks || tasksData || []);
      setOverduePayments(paymentsData.data || paymentsData || []);
    } catch (error) {
      console.error("Failed to load overdue data:", error);
    }
  };

  const loadOrderPipelines = async (params) => {
    try {
      const data = await orderAPI.getAllOrders(params);
      setOrderPipelines(data.data || data || []);
    } catch (error) {
      console.error("Failed to load order pipelines:", error);
    }
  };

  const handleExport = async (format = "excel") => {
    try {
      const reportType = getReportType();
      const blob = await reportAPI.exportExcel(reportType, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_${dateRange.startDate}_${dateRange.endDate}.xlsx`;
      a.click();
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Failed to export report:", error);
      toast.error("Failed to export report");
    }
  };

  const getReportType = () => {
    const types = [
      "regional-sales",
      "outstanding-receivables",
      "invoice-register",
      "dealers",
      "managers",
      "territory-performance",
      "campaign-performance",
      "inventory",
      "overdue-tasks-payments",
      "order-pipelines",
    ];
    return types[activeTab];
  };

  const renderSalesReport = () => {
    if (!salesData) return <Typography>No sales data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h4" color="primary">
                ₹{Number(salesData.totalSales || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" color="primary">
                {salesData.totalOrders || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Order Value
              </Typography>
              <Typography variant="h4" color="primary">
                ₹{Number(salesData.averageOrderValue || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {salesData.breakdown && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales by Territory
                </Typography>
                <DataTable
                  columns={[
                    { key: "territoryName", label: "Territory" },
                    { key: "totalSales", label: "Sales", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
                    { key: "orderCount", label: "Orders" },
                  ]}
                  rows={salesData.breakdown}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderOutstandingReport = () => {
    if (!outstandingData) return <Typography>No outstanding data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Outstanding
              </Typography>
              <Typography variant="h4" color="error">
                ₹{Number(outstandingData.totalOutstanding || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue Amount
              </Typography>
              <Typography variant="h4" color="error">
                ₹{Number(outstandingData.overdueAmount || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {outstandingData.breakdown && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outstanding by Dealer
                </Typography>
                <DataTable
                  columns={[
                    { key: "dealerName", label: "Dealer" },
                    { key: "outstanding", label: "Outstanding", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
                    { key: "overdue", label: "Overdue", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
                  ]}
                  rows={outstandingData.breakdown}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderInvoicesReport = () => {
    return (
      <Card>
        <CardContent>
          <DataTable
            columns={[
              { key: "invoiceNumber", label: "Invoice #" },
              { key: "dealer.businessName", label: "Dealer" },
              { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
              { key: "status", label: "Status" },
              { key: "createdAt", label: "Date", render: (v) => new Date(v).toLocaleDateString() },
            ]}
            rows={invoicesData}
            emptyMessage="No invoices found"
          />
        </CardContent>
      </Card>
    );
  };

  const renderDealersReport = () => {
    return (
      <Card>
        <CardContent>
          <DataTable
            columns={[
              { key: "businessName", label: "Dealer Name" },
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "territory.name", label: "Territory" },
              { key: "status", label: "Status" },
            ]}
            rows={dealersData}
            emptyMessage="No dealers found"
          />
        </CardContent>
      </Card>
    );
  };

  const renderManagersReport = () => {
    return (
      <Card>
        <CardContent>
          <DataTable
            columns={[
              { key: "username", label: "Username" },
              { key: "email", label: "Email" },
              { key: "role.name", label: "Role" },
              { key: "region.name", label: "Region" },
              { key: "area.name", label: "Area" },
              { key: "territory.name", label: "Territory" },
            ]}
            rows={managersData}
            emptyMessage="No managers found"
          />
        </CardContent>
      </Card>
    );
  };

  const renderTerritoryPerformance = () => {
    return (
      <Card>
        <CardContent>
          <DataTable
            columns={[
              { key: "territoryName", label: "Territory" },
              { key: "totalSales", label: "Sales", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
              { key: "dealerCount", label: "Dealers" },
              { key: "orderCount", label: "Orders" },
              { key: "averageOrderValue", label: "Avg Order Value", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
            ]}
            rows={territoryPerformance}
            emptyMessage="No territory performance data available"
          />
        </CardContent>
      </Card>
    );
  };

  const renderCampaignPerformance = () => {
    return (
      <Grid container spacing={2}>
        {campaignPerformance.map((campaign) => (
          <Grid item xs={12} md={6} key={campaign.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {campaign.name}
                </Typography>
                {campaign.analytics && (
                  <Box>
                    <Typography variant="body2">
                      Participation: {campaign.analytics.participation?.participated || 0} /{" "}
                      {campaign.analytics.participation?.totalTargeted || 0}
                    </Typography>
                    <Typography variant="body2">
                      Revenue: ₹{Number(campaign.analytics.revenue?.total || 0).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderInventoryReport = () => {
    if (!inventoryData) return <Typography>No inventory data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">{inventoryData.totalItems || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Stock
              </Typography>
              <Typography variant="h4">{inventoryData.availableStock || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning">
                {inventoryData.lowStockItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderOverdueReport = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue Tasks ({overdueTasks.length})
              </Typography>
              <DataTable
                columns={[
                  { key: "title", label: "Task" },
                  { key: "type", label: "Type" },
                  { key: "dueDate", label: "Due Date", render: (v) => new Date(v).toLocaleDateString() },
                ]}
                rows={overdueTasks}
                emptyMessage="No overdue tasks"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue Payments ({overduePayments.length})
              </Typography>
              <DataTable
                columns={[
                  { key: "invoiceNumber", label: "Invoice" },
                  { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
                  { key: "dueDate", label: "Due Date", render: (v) => new Date(v).toLocaleDateString() },
                ]}
                rows={overduePayments}
                emptyMessage="No overdue payments"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderOrderPipelines = () => {
    return (
      <Card>
        <CardContent>
          <DataTable
            columns={[
              { key: "orderNumber", label: "Order #" },
              { key: "dealer.businessName", label: "Dealer" },
              { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
              { key: "status", label: "Status" },
              { key: "approvalStage", label: "Approval Stage" },
              { key: "createdAt", label: "Date", render: (v) => new Date(v).toLocaleDateString() },
            ]}
            rows={orderPipelines}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (activeTab) {
      case 0:
        return renderSalesReport();
      case 1:
        return renderOutstandingReport();
      case 2:
        return renderInvoicesReport();
      case 3:
        return renderDealersReport();
      case 4:
        return renderManagersReport();
      case 5:
        return renderTerritoryPerformance();
      case 6:
        return renderCampaignPerformance();
      case 7:
        return renderInventoryReport();
      case 8:
        return renderOverdueReport();
      case 9:
        return renderOrderPipelines();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Reports"
        subtitle="Comprehensive reports for your region"
      />

      {/* Date Range & Export */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              type="date"
              label="Start Date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              type="date"
              label="End Date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport("excel")}
            >
              Export Excel
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Sales" />
            <Tab label="Outstanding" />
            <Tab label="Invoices" />
            <Tab label="Dealers" />
            <Tab label="Managers" />
            <Tab label="Territory Performance" />
            <Tab label="Campaign Performance" />
            <Tab label="Inventory" />
            <Tab label="Overdue Tasks/Payments" />
            <Tab label="Order Pipelines" />
          </Tabs>
        </Box>
        <CardContent>{renderReportContent()}</CardContent>
      </Card>
    </Box>
  );
}

