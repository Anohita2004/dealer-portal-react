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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { campaignAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function CampaignApprovals() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        regionId: user.regionId,
        approvalStatus: "pending",
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

  const handleApprove = async (campaignId) => {
    try {
      await campaignAPI.updateCampaign(campaignId, { approvalStatus: "approved" });
      toast.success("Campaign approved successfully");
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to approve campaign:", error);
      toast.error(error.response?.data?.error || "Failed to approve campaign");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await campaignAPI.updateCampaign(selectedCampaign.id, {
        approvalStatus: "rejected",
        rejectionReason: rejectReason,
      });
      toast.success("Campaign rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to reject campaign:", error);
      toast.error(error.response?.data?.error || "Failed to reject campaign");
    }
  };

  const openRejectDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      active: "info",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Campaign Approvals"
        subtitle="Review and approve campaigns in your region"
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
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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
                          label={campaign.approvalStatus || campaign.status || "pending"}
                          size="small"
                          color={getStatusColor(campaign.approvalStatus || campaign.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {(campaign.approvalStatus === "pending" ||
                          campaign.status === "pending") && (
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle size={14} />}
                              onClick={() => handleApprove(campaign.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<XCircle size={14} />}
                              onClick={() => openRejectDialog(campaign)}
                            >
                              Reject
                            </Button>
                          </Stack>
                        )}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Campaign</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            sx={{ mt: 2, minWidth: 400 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

