import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

const reportCategories = [
  {
    id: "overview",
    label: "Overview",
    reports: [
      {
        id: "admin-summary",
        title: "Admin Summary",
        description: "Global KPIs and system overview",
        icon: <BarChart3 size={24} />,
        color: "#3b82f6",
        route: "/reports?type=admin-summary",
      },
      {
        id: "pending-approvals",
        title: "Pending Approvals",
        description: "All pending approvals across the system",
        icon: <Clock size={24} />,
        color: "#f59e0b",
        route: "/reports?type=pending-approvals",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & Performance",
    reports: [
      {
        id: "regional-sales-summary",
        title: "Regional Sales Summary",
        description: "Sales breakdown by region, territory, and dealer",
        icon: <TrendingUp size={24} />,
        color: "#10b981",
        route: "/reports?type=regional-sales-summary",
      },
      {
        id: "dealer-performance",
        title: "Dealer Performance",
        description: "Individual dealer performance metrics",
        icon: <Users size={24} />,
        color: "#8b5cf6",
        route: "/reports?type=dealer-performance",
      },
      {
        id: "territory",
        title: "Territory Summary",
        description: "Territory-wise sales and performance",
        icon: <MapPin size={24} />,
        color: "#6366f1",
        route: "/reports?type=territory",
      },
    ],
  },
  {
    id: "financial",
    label: "Financial Reports",
    reports: [
      {
        id: "account-statement",
        title: "Account Statement",
        description: "Account statements for dealers",
        icon: <FileText size={24} />,
        color: "#059669",
        route: "/reports?type=account-statement",
      },
      {
        id: "invoice-register",
        title: "Invoice Register",
        description: "Complete invoice register",
        icon: <FileText size={24} />,
        color: "#0d9488",
        route: "/reports?type=invoice-register",
      },
      {
        id: "outstanding-receivables",
        title: "Outstanding Receivables",
        description: "Outstanding amounts by dealer",
        icon: <DollarSign size={24} />,
        color: "#ef4444",
        route: "/reports?type=outstanding-receivables",
      },
      {
        id: "credit-debit-notes",
        title: "Credit / Debit Notes",
        description: "Credit and debit notes register",
        icon: <FileText size={24} />,
        color: "#f97316",
        route: "/reports?type=credit-debit-notes",
      },
    ],
  },
];

export default function SuperAdminReports() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleReportClick = (route) => {
    navigate(route);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Super Admin Reports"
        subtitle="Comprehensive reporting and analytics"
      />

      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {reportCategories.map((category) => (
          <Tab key={category.id} label={category.label} />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        {reportCategories[selectedTab].reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
              onClick={() => handleReportClick(report.route)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${report.color}20`,
                      color: report.color,
                    }}
                  >
                    {report.icon}
                  </Box>
                  <Typography variant="h6">{report.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {report.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportClick(report.route);
                  }}
                >
                  View Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BarChart3 size={18} />}
              onClick={() => navigate("/reports?type=admin-summary")}
            >
              View All Reports
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircle size={18} />}
              onClick={() => navigate("/tasks")}
            >
              Pending Tasks
            </Button>
            <Button
              variant="outlined"
              startIcon={<MapPin size={18} />}
              onClick={() => navigate("/map-view")}
            >
              View Map
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

