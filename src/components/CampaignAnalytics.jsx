import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { campaignAPI } from "../services/api";
import { toast } from "react-toastify";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function CampaignAnalytics({ campaignId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await campaignAPI.getCampaignAnalytics(campaignId);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch campaign analytics:", error);
      toast.error("Failed to load campaign analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No analytics data available</Typography>
      </Box>
    );
  }

  const participationData = [
    {
      name: "Participated",
      value: analytics.participation?.participated || 0,
    },
    {
      name: "Not Participated",
      value: (analytics.participation?.totalTargeted || 0) - (analytics.participation?.participated || 0),
    },
  ];

  const revenueData = analytics.revenue?.breakdown || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {analytics.campaignName || "Campaign Analytics"}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Participation Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Participation
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Participated: {analytics.participation?.participated || 0} /{" "}
                  {analytics.participation?.totalTargeted || 0}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {analytics.participation?.participationRate || 0}%
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={participationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {participationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ₹{Number(analytics.revenue?.total || 0).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Attributed Revenue
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  ₹{Number(analytics.revenue?.attributed || 0).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Breakdown Chart */}
        {revenueData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

