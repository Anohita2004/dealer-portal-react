import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { teamAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function TeamPerformance() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamAPI.getTeams();
      const teamsList = Array.isArray(data) ? data : data.teams || [];
      
      // Fetch performance data for each team
      const teamsWithPerformance = await Promise.all(
        teamsList.map(async (team) => {
          try {
            const performance = await teamAPI.getTeamPerformance(team.id);
            return {
              ...team,
              performance: performance || {
                totalSales: 0,
                totalOrders: 0,
                totalPayments: 0,
                totalInvoices: 0,
              },
            };
          } catch (err) {
            return {
              ...team,
              performance: {
                totalSales: 0,
                totalOrders: 0,
                totalPayments: 0,
                totalInvoices: 0,
              },
            };
          }
        })
      );
      
      setTeams(teamsWithPerformance);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const chartData = teams.map((team) => ({
    name: team.name || team.teamName || "Unknown",
    sales: team.performance?.totalSales || 0,
    orders: team.performance?.totalOrders || 0,
  }));

  if (loading) {
    return <Typography>Loading team performance...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Team Performance"
        subtitle="View sales, orders, payments, and invoices by team"
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {teams.map((team) => (
          <Grid item xs={12} md={6} lg={4} key={team.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {team.name || team.teamName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {team.description || "No description"}
                </Typography>
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DollarSign size={16} />
                    <Typography variant="body2">
                      Sales: ₹{Number(team.performance?.totalSales || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Package size={16} />
                    <Typography variant="body2">
                      Orders: {team.performance?.totalOrders || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DollarSign size={16} />
                    <Typography variant="body2">
                      Payments: ₹{Number(team.performance?.totalPayments || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Package size={16} />
                    <Typography variant="body2">
                      Invoices: {team.performance?.totalInvoices || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${team.members?.length || 0} Members`}
                    size="small"
                    icon={<Users size={14} />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {chartData.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Team Sales & Orders Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#3b82f6" name="Sales (₹)" />
                <Bar dataKey="orders" fill="#10b981" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

