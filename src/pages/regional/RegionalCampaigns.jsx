import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  IconButton,
  Button,
} from "@mui/material";
import { Search, RefreshCw, Eye, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { campaignAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
        regionId: user.regionId,
      };

      const data = await campaignAPI.getCampaigns(params);
      setCampaigns(data.data || data.campaigns || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast.error("Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, searchTerm, statusFilter]);

  const getStatusColor = (status, isActive) => {
    if (status === "approved" && isActive) return "success";
    if (status === "pending") return "warning";
    if (status === "rejected") return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Campaigns"
        subtitle="View campaigns in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Campaigns</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={() => fetchCampaigns()}>
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Campaign Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>{campaign.campaignName || campaign.name || "N/A"}</TableCell>
                      <TableCell>{campaign.campaignType || "N/A"}</TableCell>
                      <TableCell>
                        {campaign.startDate
                          ? new Date(campaign.startDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {campaign.endDate
                          ? new Date(campaign.endDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            campaign.isActive
                              ? "Active"
                              : campaign.approvalStatus || campaign.status || "Inactive"
                          }
                          size="small"
                          color={getStatusColor(campaign.approvalStatus || campaign.status, campaign.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TrendingUp size={14} />}
                            onClick={() => navigate(`/regional/campaigns/analytics/${campaign.id}`)}
                          >
                            Analytics
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

