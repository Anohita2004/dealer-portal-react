import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
} from "@mui/material";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * ApprovalActions Component
 * Shows approve/reject buttons with remarks input
 * Only visible if user's role matches current stage
 */
export default function ApprovalActions({
  workflow,
  entityType,
  entityId,
  onApprove,
  onReject,
  loading = false,
  error = null,
}) {
  const { user } = useAuth();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationError, setValidationError] = useState("");

  if (!workflow) {
    return null;
  }

  const { currentStage, approvalStatus, pipeline } = workflow;
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";

  // Check if current user can approve at current stage
  const canApprove = () => {
    if (!user || !currentStage || isApproved || isRejected) return false;

    // Map user role to stage
    const roleToStage = {
      dealer_admin: "dealer_admin",
      territory_manager: "territory_manager",
      area_manager: "area_manager",
      regional_manager: "regional_manager",
      regional_admin: "regional_admin",
      super_admin: "super_admin",
    };

    const userStage = roleToStage[user.role];
    return userStage === currentStage;
  };

  const userCanApprove = canApprove();

  // Handle approve
  const handleApprove = () => {
    if (!remarks.trim()) {
      setValidationError("Remarks are required");
      return;
    }
    setValidationError("");
    if (onApprove) {
      onApprove(remarks);
      setApproveDialogOpen(false);
      setRemarks("");
    }
  };

  // Handle reject
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setValidationError("Rejection reason is required");
      return;
    }
    setValidationError("");
    if (onReject) {
      onReject(rejectionReason, remarks);
      setRejectDialogOpen(false);
      setRejectionReason("");
      setRemarks("");
    }
  };

  // Format stage name
  const formatStageName = (stage) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isApproved || isRejected || !userCanApprove) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Approval Actions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!userCanApprove && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to approve at the current stage ({formatStageName(currentStage)}).
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<XCircle size={18} />}
          onClick={() => setRejectDialogOpen(true)}
          disabled={loading || !userCanApprove}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle size={18} />}
          onClick={() => setApproveDialogOpen(true)}
          disabled={loading || !userCanApprove}
        >
          Approve
        </Button>
      </Box>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => {
          setApproveDialogOpen(false);
          setRemarks("");
          setValidationError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle size={24} color="#22c55e" />
            <Typography variant="h6">Approve {formatStageName(currentStage)}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are approving this {entityType} at the {formatStageName(currentStage)} stage.
          </Typography>
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Remarks (Optional)"
            placeholder="Enter any remarks or notes..."
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setValidationError("");
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setApproveDialogOpen(false);
              setRemarks("");
              setValidationError("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? "Approving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectionReason("");
          setRemarks("");
          setValidationError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <XCircle size={24} color="#ef4444" />
            <Typography variant="h6">Reject {formatStageName(currentStage)}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejection. This will be visible to the requester.
          </Typography>
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason *"
            placeholder="Enter reason for rejection..."
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              setValidationError("");
            }}
            required
            error={!rejectionReason.trim() && validationError}
            helperText={!rejectionReason.trim() ? "Rejection reason is required" : ""}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Remarks (Optional)"
            placeholder="Enter any additional remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectionReason("");
              setRemarks("");
              setValidationError("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

