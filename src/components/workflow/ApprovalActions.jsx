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
  Chip,
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
  const role = user?.role?.toLowerCase?.() || "";

  if (!workflow) {
    return null;
  }

  const { currentStage, approvalStatus, pipeline } = workflow;
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";

  // Check if current user can approve at current stage
  const canApprove = () => {
    if (!user || !currentStage || isApproved || isRejected) return false;

    // Aggressive normalization
    const normalize = (str) => String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();

    // We try both user.role and the 'role' variable from line 37
    const userRoleStr = user.role || role || "";
    const normRole = normalize(userRoleStr);
    const normStage = normalize(currentStage);

    // 1. Super Admin Bypass
    if (normRole.includes("superadmin")) return true;

    // 2. Exact Normalized Match
    if (normRole === normStage) return true;

    // 3. Keyword Match (e.g., "territory" in both "territory_manager" and "Territory Manager")
    // Only for specific manager roles to avoid false positives
    const keywords = ["territory", "area", "regional", "finance", "dealer"];
    for (const kw of keywords) {
      if (normRole.includes(kw) && normStage.includes(kw)) {
        return true;
      }
    }

    // 4. Generic Stage Mapping (e.g., "Stage 3")
    if (normStage.startsWith("stage")) {
      const stageNum = parseInt(normStage.replace(/\D/g, ""), 10);
      const pipeline = ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager", "regional_admin"];
      if (!isNaN(stageNum) && stageNum > 0) {
        const mappedRole = pipeline[stageNum - 1];
        if (normRole === normalize(mappedRole) || normRole.includes(normalize(mappedRole))) return true;
      }
    }

    // 5. Dealer Admin Override
    const entityDealerId = workflow?.dealerId || workflow?.dealer_id;
    if (normRole.includes("dealeradmin") && entityDealerId && String(entityDealerId) === String(user?.dealerId)) {
      return true;
    }

    return false;
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
    if (!stage) return "Unknown Stage";
    return String(stage)
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Show component even if user can't approve, to explain why
  if (isApproved || isRejected) {
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
          Approval Status
        </Typography>
        <Alert severity={isApproved ? "success" : "error"}>
          This {entityType} has been {isApproved ? "approved" : "rejected"} and is no longer pending approval.
        </Alert>
      </Box>
    );
  }

  // If user can't approve, show explanation instead of hiding
  if (!userCanApprove) {
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
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Waiting for {formatStageName(currentStage)} approval
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your role ({user?.role ? formatStageName(user.role) : "N/A"}) does not match the current approval stage.{" "}
              This item is currently at the <strong>{formatStageName(currentStage)}</strong> stage and requires approval from a{" "}
              {formatStageName(currentStage)}.
            </Typography>
          </Box>
        </Alert>
        {pipeline && pipeline.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Approval Pipeline:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {pipeline.map((stage, index) => (
                <Chip
                  key={stage}
                  label={`${index + 1}. ${formatStageName(stage)}`}
                  size="small"
                  color={stage === currentStage ? "primary" : "default"}
                  variant={stage === currentStage ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
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
          Block
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

          {/* What happens after approve - Backend Intelligence */}
          {workflow && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                What happens next:
              </Typography>
              {workflow.isFinal ? (
                <Typography variant="caption" component="div">
                  This is the final approval stage. After approval, this {entityType} will be <strong>fully approved</strong> and the workflow will be complete.
                </Typography>
              ) : workflow.pendingStages && workflow.pendingStages.length > 0 ? (
                <Typography variant="caption" component="div">
                  After approval, this {entityType} will move to the <strong>{formatStageName(workflow.pendingStages[0])}</strong> stage for the next level of approval.
                </Typography>
              ) : (
                <Typography variant="caption" component="div">
                  After approval, this {entityType} will proceed to the next stage in the approval pipeline.
                </Typography>
              )}
            </Alert>
          )}

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
            <Typography variant="h6">Block {formatStageName(currentStage)}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejection. This will be visible to the requester.
          </Typography>

          {/* What happens after reject - Backend Intelligence */}
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              What happens after blocking:
            </Typography>
            <Typography variant="caption" component="div">
              Blocking this {entityType} will <strong>stop the approval workflow</strong>. The requester will be notified with your reason, and they may need to resubmit with corrections.
            </Typography>
          </Alert>

          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Block Reason *"
            placeholder="Enter reason for blocking..."
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
            {loading ? "Blocking..." : "Block"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

