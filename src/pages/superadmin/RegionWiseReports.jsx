import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import { Download, TrendingUp, DollarSign, Package, FileText, MapPin } from "lucide-react";
import { reportAPI, geoAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];

export default function RegionWiseReports() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [regions, setRegions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchRegions();
    if (selectedRegion !== "all") {
      fetchRegionData();
    }
  }, [selectedRegion]);

  const fetchRegions = async () => {
    try {
      const data = await geoAPI.getRegions();
      setRegions(Array.isArray(data) ? data : data.regions || []);
    } catch (error) {
      console.error("Failed to fetch regions:", error);
    }
  };

  const fetchRegionData = async () => {
    try {
      setLoading(true);
      const params = selectedRegion !== "all" ? { regionId: selectedRegion } : {};
      const data = await reportAPI.getRegionalSales(params);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch region data:", error);
      toast.error("Failed to load region data");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { label: "Sales Summary", value: "sales" },
    { label: "Outstanding", value: "outstanding" },
    { label: "Orders", value: "orders" },
    { label: "Invoices", value: "invoices" },
    { label: "Performance", value: "performance" },
  ];

  const salesData = reportData?.territories || reportData?.data || [];
  const outstandingData = reportData?.outstanding || [];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Region-Wise Reports"
        subtitle="Hierarchical view: Region → Area → Territory → Dealer → Staff"
        action={
          <Button variant="outlined" startIcon={<Download size={18} />}>
            Export Report
          </Button>
        }
      />

      <Box sx={{ mt: 3, mb: 3, display: "flex", gap: 2 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Select Region</InputLabel>
          <Select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} label="Select Region">
            <MenuItem value="all">All Regions</MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name || region.regionName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => navigate("/map-view")}
          startIcon={<MapPin size={18} />}
        >
          View on Map
        </Button>
      </Box>

      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        {tabs.map((tab, index) => (
          <Tab key={tab.value} label={tab.label} value={index} />
        ))}
      </Tabs>

      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales by Region
                </Typography>
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Sales (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">No sales data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Region Distribution
                </Typography>
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salesData}
                        dataKey="sales"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {salesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">No data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Outstanding Payments by Region
            </Typography>
            {outstandingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={outstandingData}>
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="outstanding" fill="#ef4444" name="Outstanding (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No outstanding data available</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Orders by Region
          </Typography>
          <Typography color="text.secondary">
            Use the "All Orders" page for detailed order information
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/superadmin/orders")}
            sx={{ mt: 2 }}
          >
            View All Orders
          </Button>
        </Box>
      )}

      {selectedTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Invoices by Region
          </Typography>
          <Typography color="text.secondary">
            Use the "All Invoices" page for detailed invoice information
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/superadmin/invoices")}
            sx={{ mt: 2 }}
          >
            View All Invoices
          </Button>
        </Box>
      )}

      {selectedTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <TrendingUp size={24} color="#10b981" />
                  <Typography variant="h6">Manager Performance</Typography>
                </Box>
                <Typography color="text.secondary">
                  View manager performance metrics in the Team Performance page
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/superadmin/teams/performance")}
                  sx={{ mt: 2 }}
                >
                  View Team Performance
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Package size={24} color="#3b82f6" />
                  <Typography variant="h6">Dealer Performance</Typography>
                </Box>
                <Typography color="text.secondary">
                  View dealer performance in the All Dealers page
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/superadmin/dealers")}
                  sx={{ mt: 2 }}
                >
                  View All Dealers
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

