import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
} from "@mui/material";
import { Play, Settings, Database, Shield } from "lucide-react";
import api, { adminAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function SystemAdmin() {
  const [loading, setLoading] = useState(false);

  const handleRunSLACheck = async () => {
    try {
      setLoading(true);
      const result = await adminAPI.runSLACheck();
      toast.success(
        `SLA check completed. ${result.overdueCount || 0} overdue items found, ${result.notificationsSent || 0} notifications sent.`
      );
    } catch (error) {
      console.error("Failed to run SLA check:", error);
      toast.error(error.response?.data?.error || "Failed to run SLA check");
    } finally {
      setLoading(false);
    }
  };

  const systemActions = [
    {
      title: "Run SLA Check",
      description: "Manually trigger SLA check for overdue items",
      icon: <Play size={24} />,
      color: "#3b82f6",
      action: handleRunSLACheck,
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: <Settings size={24} />,
      color: "#8b5cf6",
      action: () => toast.info("System settings coming soon"),
    },
    {
      title: "Database Backup",
      description: "Create database backup",
      icon: <Database size={24} />,
      color: "#10b981",
      action: () => toast.info("Database backup coming soon"),
    },
    {
      title: "Security Audit",
      description: "Run security audit logs",
      icon: <Shield size={24} />,
      color: "#ef4444",
      action: () => toast.info("Security audit coming soon"),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="System Administration"
        subtitle="Manage system operations and configurations"
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {systemActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
              onClick={action.action}
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
                      bgcolor: `${action.color}20`,
                      color: action.color,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6">{action.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
                {action.title === "Run SLA Check" && (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    disabled={loading}
                  >
                    {loading ? "Running..." : "Run Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Chip label="Backend: API v1.0" variant="outlined" />
            <Chip label="Frontend: React 19" variant="outlined" />
            <Chip label="Database: Connected" variant="outlined" color="success" />
            <Chip label="Socket.IO: Active" variant="outlined" color="success" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

