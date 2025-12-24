import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Divider,
  Alert
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PendingIcon from "@mui/icons-material/Pending";
import CloseIcon from "@mui/icons-material/Close";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ApprovalWorkflow = ({
  entity,
  currentStage,
  approvalStatus,
  onApprove,
  onReject,
  showActions = true,
  approvalHistory = [],
  showHistory = true
}) => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.() || "";
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  // Define workflow stages based on entity type
  const getStages = (type) => {
    const workflows = {
      // Order workflow now includes dealer_admin as the first stage
      // so dealer admins can approve orders before manager levels
      order: ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager"],
      invoice: ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager", "regional_admin"],
      payment: ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager", "regional_admin"],
      document: ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager"],
      pricing: ["area_manager", "regional_admin", "super_admin"],
      campaign: ["area_manager", "regional_admin", "super_admin"],
    };

    // If entity has a custom pipeline from workflow service, use it instead
    if (entity?.pipeline && Array.isArray(entity.pipeline)) {
      return entity.pipeline;
    }

    return workflows[type] || [];
  };

  const stages = getStages(entity?.type || entity?.entityType || "order");

  // Try to find index by exact name, or by parsing "StageX" pattern
  let currentIndex = currentStage ? stages.indexOf(currentStage) : -1;
  if (currentIndex === -1 && currentStage?.toLowerCase().startsWith("stage")) {
    const stageNum = parseInt(currentStage.replace(/\D/g, ''), 10);
    if (!isNaN(stageNum) && stageNum > 0 && stageNum <= stages.length) {
      currentIndex = stageNum - 1;
    }
  }
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  // Check if order is fully approved (at final stage and approved)
  const isFullyApproved = isApproved && (currentIndex === stages.length - 1 || currentIndex === -1);

  const getStageLabel = (stage) => {
    // If it's a generic "StageX", try to get the name from the stages array
    if (stage?.toLowerCase().startsWith("stage")) {
      const stageNum = parseInt(stage.replace(/\D/g, ''), 10);
      if (!isNaN(stageNum) && stageNum > 0 && stageNum <= stages.length) {
        stage = stages[stageNum - 1];
      }
    }

    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStepStatus = (index) => {
    if (isRejected) {
      return index <= currentIndex ? "error" : "disabled";
    }
    if (isApproved) {
      return "completed";
    }
    if (index < currentIndex) {
      return "completed";
    }
    if (index === currentIndex) {
      return "active";
    }
    return "pending";
  };

  const canApproveAtCurrentStage = () => {
    if (role === "super_admin") return true;
    if (!currentStage) return false;

    // Basic role match
    if (role === currentStage) return true;

    // Handle generic Stage1 mapping for dealer_admin
    if (role === "dealer_admin" && (currentStage === "Stage1" || currentIndex === 0)) return true;

    // Dealer Admin privilege: Can always approve/block items for their own dealer
    // (This overrides the stage-gate for the dealer's own hierarchy)
    const entityDealerId = entity?.dealerId || entity?.dealer_id || (entity?.dealer && (entity.dealer.id || entity.dealer._id));
    if (role === "dealer_admin" && entityDealerId && String(entityDealerId) === String(user?.dealerId)) return true;

    return false;
  };

  const userCanApprove = canApproveAtCurrentStage();

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Approval Status:
        </Typography>
        <Chip
          label={approvalStatus?.toUpperCase() || "PENDING"}
          color={
            isApproved ? "success" : isRejected ? "error" : "warning"
          }
          size="small"
        />
        {!isApproved && !isRejected && currentStage && !userCanApprove && (
          <Typography variant="caption" color="text.secondary">
            (Awaiting {getStageLabel(currentStage)})
          </Typography>
        )}
      </Box>

      <Stepper activeStep={isApproved ? stages.length : currentIndex} orientation="horizontal">
        {stages.map((stage, index) => {
          const status = getStepStatus(index);
          return (
            <Step key={stage} completed={status === "completed"} active={status === "active"}>
              <StepLabel
                StepIconComponent={
                  status === "completed"
                    ? CheckCircleIcon
                    : status === "active"
                      ? PendingIcon
                      : RadioButtonUncheckedIcon
                }
              >
                {getStageLabel(stage)}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Order Approved Message - Final Stage */}
      {isFullyApproved && (
        <Alert
          severity="success"
          icon={<CheckCircle size={24} />}
          sx={{ mt: 3, mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {entity?.type === "order" ? "Order Approved" : "Fully Approved"}
          </Typography>
          <Typography variant="body2">
            This {entity?.type || "item"} has been fully approved through all stages and is ready for the next process.
          </Typography>
        </Alert>
      )}

      {showActions && !isApproved && !isRejected && userCanApprove && (
        <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<XCircle size={18} />}
            onClick={() => setRejectDialogOpen(true)}
          >
            Block
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle size={18} />}
            onClick={() => onApprove && onApprove()}
          >
            Approve
          </Button>
        </Box>
      )}

      {/* Approval History Timeline */}
      {showHistory && approvalHistory && approvalHistory.length > 0 && (
        <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #e5e7eb" }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: "1rem", fontWeight: 600 }}>
            Approval History
          </Typography>
          <Box sx={{ position: "relative" }}>
            {approvalHistory.map((historyItem, index) => {
              const isApprove = historyItem.action === "approve";
              const isReject = historyItem.action === "reject";
              const isPending = historyItem.action === "pending";

              return (
                <Box key={index} sx={{ display: "flex", mb: 3, position: "relative" }}>
                  {/* Timeline Line */}
                  {index < approvalHistory.length - 1 && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: "20px",
                        top: "40px",
                        bottom: "-16px",
                        width: "2px",
                        bgcolor: "divider",
                      }}
                    />
                  )}

                  {/* Timeline Dot */}
                  <Box sx={{ mr: 2, position: "relative", zIndex: 1 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: isApprove
                          ? "success.main"
                          : isReject
                            ? "error.main"
                            : "grey.400",
                        border: isPending ? "2px solid" : "none",
                        borderColor: isPending ? "grey.400" : "transparent",
                      }}
                    >
                      {isApprove ? (
                        <CheckCircle size={20} color="white" />
                      ) : isReject ? (
                        <XCircle size={20} color="white" />
                      ) : (
                        <Clock size={20} color="white" />
                      )}
                    </Avatar>
                  </Box>

                  {/* Timeline Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {historyItem.stage || historyItem.approvalStage || "Stage"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isApprove ? "Approved" : isReject ? "Rejected" : "Pending"} by{" "}
                          {historyItem.approvedBy || historyItem.userName || historyItem.user || "Unknown"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                        {historyItem.timestamp
                          ? new Date(historyItem.timestamp).toLocaleString()
                          : historyItem.createdAt
                            ? new Date(historyItem.createdAt).toLocaleString()
                            : ""}
                      </Typography>
                    </Box>
                    {historyItem.remarks && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}>
                        "{historyItem.remarks}"
                      </Typography>
                    )}
                    {historyItem.reason && (
                      <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                        Reason: {historyItem.reason}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectionReason("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Block {entity?.type || "Item"}</Typography>
            <Button
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejection. This will be visible to the requester.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            placeholder="Enter reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? "Rejection reason is required" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectionReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (rejectionReason.trim()) {
                onReject && onReject(rejectionReason);
                setRejectDialogOpen(false);
                setRejectionReason("");
              }
            }}
            disabled={!rejectionReason.trim()}
          >
            Block
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalWorkflow;

