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
import { Search, RefreshCw, CheckCircle, XCircle, Download, Eye } from "lucide-react";
import { documentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        regionId: user.regionId,
      };

      const data = await documentAPI.getDocuments(params);
      setDocuments(data.data || data.documents || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, searchTerm, statusFilter]);

  const handleApprove = async (documentId) => {
    try {
      await documentAPI.approveRejectDocument(documentId, { action: "approve" });
      toast.success("Document approved successfully");
      fetchDocuments();
    } catch (error) {
      console.error("Failed to approve document:", error);
      toast.error(error.response?.data?.error || "Failed to approve document");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await documentAPI.approveRejectDocument(selectedDocument.id, {
        action: "reject",
        reason: rejectReason,
        remarks: rejectReason,
      });
      toast.success("Document rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Failed to reject document:", error);
      toast.error(error.response?.data?.error || "Failed to reject document");
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const blob = await documentAPI.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${documentId}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      toast.error("Failed to download document");
    }
  };

  const openRejectDialog = (document) => {
    setSelectedDocument(document);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Documents"
        subtitle="View and manage documents in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search documents..."
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

            <IconButton onClick={() => fetchDocuments()}>
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
                  <TableCell>Document Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Upload Date</TableCell>
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
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.fileName || doc.name || "N/A"}</TableCell>
                      <TableCell>{doc.documentType || "N/A"}</TableCell>
                      <TableCell>
                        {doc.dealer?.businessName || doc.dealerName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.status || "pending"}
                          size="small"
                          color={getStatusColor(doc.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc.id)}
                          >
                            <Download size={16} />
                          </IconButton>
                          {(doc.status === "pending" ||
                            doc.approvalStatus === "pending") && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle size={14} />}
                                onClick={() => handleApprove(doc.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<XCircle size={14} />}
                                onClick={() => openRejectDialog(doc)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Document</DialogTitle>
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

