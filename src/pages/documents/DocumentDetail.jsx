import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { documentAPI } from "../../services/api";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../../components/workflow";
import PageHeader from "../../components/PageHeader";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("document", id);

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await documentAPI.getDocumentById(id);
        setDocument(response.document || response.data || response);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Handle approve
  const handleApprove = async (remarks) => {
    try {
      await approve(remarks);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle reject
  const handleReject = async (reason, remarks) => {
    try {
      await reject(reason, remarks);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      const blob = await documentAPI.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = document.fileName || document.name || `document-${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Failed to download document");
    }
  };

  if (loading || workflowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Document not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/documents")}
          sx={{ mt: 2 }}
        >
          Back to Documents
        </Button>
      </Box>
    );
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Get file extension
  const getFileExtension = (fileName) => {
    if (!fileName) return "";
    return fileName.split(".").pop().toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={`Document ${document.documentNumber || document.name || document.id}`}
        subtitle="View document details and approval workflow"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/documents")}
        >
          Back to Documents
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Download Document
        </Button>
      </Box>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Document Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Document Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Document Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {document.name || document.fileName || document.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={document.status?.toUpperCase() || "PENDING"}
                    color={
                      document.status === "approved"
                        ? "success"
                        : document.status === "rejected"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Document Type
                  </Typography>
                  <Chip
                    label={document.documentType || document.type || "N/A"}
                    size="small"
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    File Type
                  </Typography>
                  <Chip
                    label={getFileExtension(document.fileName || document.name)}
                    size="small"
                    icon={<FileText size={16} />}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dealer
                  </Typography>
                  <Typography variant="body1">
                    {document.dealer?.name || document.dealerName || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded Date
                  </Typography>
                  <Typography variant="body1">{formatDate(document.uploadedAt || document.createdAt)}</Typography>
                </Grid>

                {document.uploadedBy && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded By
                    </Typography>
                    <Typography variant="body1">
                      {document.uploadedBy?.username || document.uploadedBy?.name || "N/A"}
                    </Typography>
                  </Grid>
                )}

                {document.fileSize && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Size
                    </Typography>
                    <Typography variant="body1">
                      {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Grid>
                )}

                {document.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{document.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Document Preview (if image) */}
          {document.fileUrl && (document.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) || document.type === "image") && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Document Preview
                </Typography>
                <Box
                  component="img"
                  src={document.fileUrl}
                  alt={document.name}
                  sx={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Workflow Section */}
        <Grid item xs={12} md={4}>
          {/* Workflow Progress Bar */}
          {workflow && <WorkflowProgressBar workflow={workflow} />}

          {/* Workflow Status */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <WorkflowStatus workflow={workflow} entityType="document" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="document"
                entityId={id}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={workflowLoading}
                error={workflowError}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Workflow Timeline */}
      {workflow && workflow.timeline && (
        <Box sx={{ mt: 3 }}>
          <WorkflowTimeline timeline={workflow.timeline} workflow={workflow} />
        </Box>
      )}
    </Box>
  );
}

