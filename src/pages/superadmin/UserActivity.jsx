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
} from "@mui/material";
import { Search, Clock, User, Activity } from "lucide-react";
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

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="User Activity Logs"
        subtitle="Monitor all user activities and system events"
      />

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Timestamp</TableCell>
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
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>{activity.entityType || activity.type || "N/A"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description || activity.details || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock size={14} />
                      {activity.timestamp || activity.createdAt
                        ? new Date(activity.timestamp || activity.createdAt).toLocaleString()
                        : "N/A"}
                    </Box>
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

