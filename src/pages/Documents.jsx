import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import { documentAPI, invoiceAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getRoleName } from "../utils/authUtils";

// Document Types
const DOCUMENT_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "payment_proof", label: "Payment Proof" },
  { value: "agreement", label: "Dealer Agreement" },
  { value: "compliance", label: "Compliance Doc" },
  { value: "identification", label: "Identification" },
  { value: "other", label: "Other" },
];

export default function Documents() {
  const { user } = useContext(AuthContext);
  const userRole = getRoleName(user);
  const isDealer = userRole.includes("dealer");
  const isAdmin = userRole.includes("admin") || userRole.includes("manager");

  // Data state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Dialogs
  const [uploadDialog, setUploadDialog] = useState(false);
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState("other");

  const [verifyDialog, setVerifyDialog] = useState({ open: false, doc: null, action: null });
  const [remarks, setRemarks] = useState("");

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Standard Documents
      // 1. Fetch Standard Documents
      const docRes = await documentAPI.getDocuments();
      let rawDocs = [];
      if (Array.isArray(docRes)) {
        rawDocs = docRes;
      } else if (docRes.documents && Array.isArray(docRes.documents)) {
        rawDocs = docRes.documents;
      } else if (docRes.data && Array.isArray(docRes.data)) {
        rawDocs = docRes.data;
      }

      // Normalize Docs to ensure critical fields exist
      const docs = rawDocs.map(d => ({
        ...d,
        uploadedAt: d.uploadedAt || d.createdAt || d.date || new Date().toISOString(),
        documentName: d.documentName || d.name || "Untitled Document",
        documentType: d.documentType || "other",
        status: d.status || "pending"
      }));

      // 2. Fetch Approved Invoices (if user should see them)
      // Dealers see their own, Admins see all (scoped by backend)
      let invoices = [];
      try {
        const invRes = await invoiceAPI.getInvoices({ status: "approved" });
        const invList = Array.isArray(invRes) ? invRes : (invRes.invoices || invRes.data || []);

        // Map invoices to document shape
        invoices = invList.map(inv => ({
          id: inv.id,
          documentName: `Invoice #${inv.invoiceNumber}`,
          documentType: "invoice",
          uploadedAt: inv.createdAt || inv.date || new Date().toISOString(),
          status: "approved",
          dealerName: inv.dealerName || "Unknown",
          isSystemInvoice: true, // Flag to distinguish system invoices
          // helper for download
          originalId: inv.id
        }));
      } catch (err) {
        console.warn("Failed to fetch invoices for documents view", err);
      }

      // 3. Merge and Sort (Newest first)
      const allItems = [...docs, ...invoices].sort((a, b) => {
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        const valA = isNaN(dateA) ? 0 : dateA;
        const valB = isNaN(dateB) ? 0 : dateB;
        return valB - valA;
      });

      setDocuments(allItems);
    } catch (err) {
      console.error("Failed to load documents:", err);
      // toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // ======================== UPLOAD HANDLERS ========================

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload files sequentially or in parallel
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", docType);

        // We use the raw axios config capability if available, or just call the API wrapper
        // Since our API wrapper handles FormData automatically in post requests usually:
        await documentAPI.uploadDocument(formData);
      }

      toast.success("Documents uploaded successfully");
      setUploadDialog(false);
      setFiles([]);
      setDocType("other");
      loadDocs();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ======================== ACTION HANDLERS ========================

  const handleDownload = async (doc) => {
    try {
      let blob;
      if (doc.isSystemInvoice) {
        blob = await invoiceAPI.downloadInvoicePDF(doc.originalId);
      } else {
        blob = await documentAPI.downloadDocument(doc.id);
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.documentName || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentAPI.deleteDocument(id);
      toast.success("Document deleted");
      loadDocs();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete document");
    }
  };

  const openVerifyDialog = (doc, action) => {
    setVerifyDialog({ open: true, doc, action });
    setRemarks("");
  };

  const handleVerify = async () => {
    const { doc, action } = verifyDialog;
    if (!doc) return;

    try {
      await documentAPI.approveRejectDocument(doc.id, {
        status: action === "approve" ? "approved" : "rejected",
        remarks: remarks,
      });
      toast.success(`Document ${action}d successfully`);
      setVerifyDialog({ open: false, doc: null, action: null });
      loadDocs();
    } catch (err) {
      console.error("Verification failed:", err);
      toast.error(`Failed to ${action} document`);
    }
  };

  // ======================== FILTERING & RENDER ========================

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = (doc.documentName || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedDocs = filteredDocs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getTypeLabel = (type) => {
    const found = DOCUMENT_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getStatusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    let color = "default";
    if (s === "approved") color = "success";
    if (s === "rejected") color = "error";
    if (s === "pending") color = "warning";

    return <Chip label={s.toUpperCase()} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Document Management"
        subtitle={isDealer ? "Upload and manage your documents" : "Review and manage dealer documents"}
        actions={[
          <Button
            key="refresh"
            variant="outlined"
            onClick={loadDocs}
            startIcon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>,
          (isDealer || isAdmin) && (
            <Button
              key="upload"
              variant="contained"
              onClick={() => setUploadDialog(true)}
              startIcon={<UploadIcon size={18} />}
            >
              Upload Document
            </Button>
          ),
        ]}
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={typeFilter}
              label="Document Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {DOCUMENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* DOCUMENT TABLE */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell>Document Name</TableCell>
                <TableCell>Type</TableCell>
                {isAdmin && <TableCell>Dealer</TableCell>}
                <TableCell>Uploaded On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No documents found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocs.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FileText size={16} color="gray" />
                        <Typography variant="body2" fontWeight={500}>{doc.documentName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getTypeLabel(doc.documentType)}</TableCell>
                    {isAdmin && <TableCell>{doc.dealerName || "-"}</TableCell>}
                    <TableCell>
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{getStatusChip(doc.status)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(doc)}>
                          <Download size={16} />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && (doc.status === "pending" || !doc.status) && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => openVerifyDialog(doc, "approve")}>
                              <CheckCircle size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => openVerifyDialog(doc, "reject")}>
                              <XCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {(isDealer || isAdmin) && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredDocs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* UPLOAD DIALOG */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={docType}
                label="Document Type"
                onChange={(e) => setDocType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ height: 100, borderStyle: "dashed" }}
            >
              {files.length > 0 ? `${files.length} file(s) selected` : "Choose File"}
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            {files.length > 0 && (
              <Box>
                {files.map((f, i) => (
                  <Typography key={i} variant="caption" display="block">
                    {f.name} ({(f.size / 1024).toFixed(1)} KB)
                  </Typography>
                ))}
              </Box>
            )}

            {uploading && <LinearProgress variant="determinate" value={uploadProgress} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VERIFY DIALOG */}
      <Dialog open={verifyDialog.open} onClose={() => setVerifyDialog({ open: false, doc: null, action: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {verifyDialog.action === "approve" ? "Approve Document" : "Reject Document"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to {verifyDialog.action} the document <strong>{verifyDialog.doc?.documentName}</strong>.
          </Typography>
          <TextField
            fullWidth
            label="Remarks (Optional)"
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialog({ open: false, doc: null, action: null })}>Cancel</Button>
          <Button
            onClick={handleVerify}
            variant="contained"
            color={verifyDialog.action === "approve" ? "success" : "error"}
          >
            Confirm {verifyDialog.action === "approve" ? "Approval" : "Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
