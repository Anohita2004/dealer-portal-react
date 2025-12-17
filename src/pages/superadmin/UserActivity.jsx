import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import { Search, Clock, User, Activity, Download, Shield, AlertCircle } from "lucide-react";
import { adminAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function UserActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchActivities();
  }, [userFilter, actionFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (userFilter !== "all") params.userId = userFilter;
      if (actionFilter !== "all") params.action = actionFilter;
      
      // Using admin reports endpoint for user activity
      const data = await adminAPI.getAdminReports(params);
      setActivities(Array.isArray(data) ? data : data.activities || data.logs || []);
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
      toast.error("Failed to load user activities");
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) =>
    activity.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Typography>Loading user activities...</Typography>;
  }

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Details"].join(","),
      ...filteredActivities.map((activity) =>
        [
          activity.timestamp || activity.createdAt || "N/A",
          activity.user?.username || activity.username || "System",
          activity.action || "N/A",
          activity.entityType || activity.type || "N/A",
          `"${(activity.description || activity.details || "N/A").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Audit logs exported successfully");
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="System Audit Logs"
        subtitle="Complete, immutable audit trail of all system activities"
        actions={[
          <Button
            key="export"
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExport}
            disabled={filteredActivities.length === 0}
          >
            Export Logs
          </Button>,
        ]}
      />

      {/* Global Scope Warning */}
      <Alert 
        severity="info" 
        icon={<Shield size={20} />} 
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Global Audit View
        </Typography>
        <Typography variant="body2">
          This view shows all activities across all regions, roles, and entities. Audit logs are immutable and provide complete traceability for governance and compliance.
        </Typography>
      </Alert>

      <Box sx={{ mt: 3, display: "flex", gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by user, action, or entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Action</InputLabel>
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} label="Action">
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="create">Create</MenuItem>
            <MenuItem value="update">Update</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="approve">Approve</MenuItem>
            <MenuItem value="reject">Reject</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
              <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Entity Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No activities found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity, index) => (
                <TableRow key={activity.id || index}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock size={14} />
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {activity.timestamp || activity.createdAt
                          ? new Date(activity.timestamp || activity.createdAt).toLocaleString()
                          : "N/A"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <User size={16} />
                      {activity.user?.username || activity.username || "System"}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.action?.toUpperCase() || "N/A"}
                      size="small"
                      color={
                        activity.action === "create"
                          ? "success"
                          : activity.action === "update"
                          ? "info"
                          : activity.action === "delete"
                          ? "error"
                          : activity.action === "approve"
                          ? "success"
                          : activity.action === "reject"
                          ? "error"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {activity.entityType || activity.type || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activity.description || activity.details || "N/A"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

