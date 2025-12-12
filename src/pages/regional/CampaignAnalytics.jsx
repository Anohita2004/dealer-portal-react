import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { campaignAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function CampaignAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await campaignAPI.getCampaignAnalytics(id);
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch campaign analytics:", error);
        toast.error("Failed to load campaign analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

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
        <PageHeader title="Campaign Analytics" subtitle="No analytics data available" />
      </Box>
    );
  }

  const stats = [
    {
      label: "Total Reach",
      value: analytics.totalReach || analytics.reach || 0,
      icon: <Users size={24} />,
      color: "#3b82f6",
    },
    {
      label: "Total Sales",
      value: `₹${Number(analytics.totalSales || analytics.sales || 0).toLocaleString()}`,
      icon: <DollarSign size={24} />,
      color: "#10b981",
    },
    {
      label: "Conversion Rate",
      value: `${Number(analytics.conversionRate || 0).toFixed(2)}%`,
      icon: <Target size={24} />,
      color: "#f59e0b",
    },
    {
      label: "ROI",
      value: `${Number(analytics.roi || 0).toFixed(2)}%`,
      icon: <TrendingUp size={24} />,
      color: "#8b5cf6",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Campaign Analytics"
        subtitle={`Analytics for ${analytics.campaignName || "Campaign"}`}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {analytics.details && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Analytics
            </Typography>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {JSON.stringify(analytics.details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

