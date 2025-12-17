import React from "react";
import { Box, Chip, Typography, LinearProgress } from "@mui/material";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * WorkflowStatus Component
 * Displays current stage in pipeline, completed stages, pending stages, and SLA countdown
 */
export default function WorkflowStatus({ workflow, entityType = "order" }) {
  if (!workflow) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Loading workflow status...
        </Typography>
      </Box>
    );
  }

  const {
    pipeline = [],
    currentStage,
    completedStages = [],
    pendingStages = [],
    approvalStatus = "pending",
    currentSlaExpiresAt,
    isFinal = false,
  } = workflow;

  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const isPending = approvalStatus === "pending";

  // Format stage name for display
  const formatStageName = (stage) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate SLA status
  const getSLAStatus = () => {
    if (!currentSlaExpiresAt) return null;

    const expiresAt = new Date(currentSlaExpiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const isOverdue = diffMs < 0;
    const isDueSoon = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000; // Less than 24 hours

    return {
      isOverdue,
      isDueSoon,
      diffHours: Math.abs(diffHours),
      diffMinutes: Math.abs(diffMinutes),
      expiresAt,
    };
  };

  const slaStatus = getSLAStatus();

  // Calculate progress percentage
  const progress =
    pipeline.length > 0
      ? ((completedStages.length + (isApproved ? 1 : 0)) / pipeline.length) * 100
      : 0;

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
      {/* Status Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Approval Status
        </Typography>
        <Chip
          label={approvalStatus?.toUpperCase() || "PENDING"}
          color={
            isApproved ? "success" : isRejected ? "error" : isPending ? "warning" : "default"
          }
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedStages.length} of {pipeline.length} stages completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: "grey.200",
            "& .MuiLinearProgress-bar": {
              bgcolor: isApproved ? "success.main" : isRejected ? "error.main" : "primary.main",
            },
          }}
        />
      </Box>

      {/* Current Stage */}
      {currentStage && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: isPending ? "warning.50" : isApproved ? "success.50" : "error.50",
            borderRadius: 1,
            border: "1px solid",
            borderColor: isPending ? "warning.200" : isApproved ? "success.200" : "error.200",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            {isApproved ? (
              <CheckCircle size={20} color="#22c55e" />
            ) : isRejected ? (
              <XCircle size={20} color="#ef4444" />
            ) : (
              <Clock size={20} color="#f59e0b" />
            )}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Current Stage: {formatStageName(currentStage)}
            </Typography>
          </Box>
          {isFinal && (
            <Typography variant="caption" color="text.secondary">
              Final approval stage
            </Typography>
          )}
          {/* Next Approver Role - Backend Intelligence */}
          {!isApproved && !isRejected && pendingStages.length > 0 && (
            <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Next Approver:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                {formatStageName(pendingStages[0])}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* SLA Countdown */}
      {slaStatus && currentStage && !isApproved && !isRejected && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: slaStatus.isOverdue ? "error.50" : slaStatus.isDueSoon ? "warning.50" : "info.50",
            borderRadius: 1,
            border: "1px solid",
            borderColor: slaStatus.isOverdue ? "error.200" : slaStatus.isDueSoon ? "warning.200" : "info.200",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {slaStatus.isOverdue ? (
              <>
                <AlertCircle size={20} color="#ef4444" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                  Overdue: {slaStatus.diffHours}h {slaStatus.diffMinutes}m
                </Typography>
              </>
            ) : (
              <>
                <Clock size={20} color={slaStatus.isDueSoon ? "#f59e0b" : "#3b82f6"} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: slaStatus.isDueSoon ? "warning.main" : "info.main",
                  }}
                >
                  SLA expires in: {slaStatus.diffHours}h {slaStatus.diffMinutes}m
                </Typography>
              </>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Expires: {slaStatus.expiresAt.toLocaleString()}
          </Typography>
        </Box>
      )}

      {/* Stages List */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Pipeline Stages
        </Typography>
        {pipeline.map((stage, index) => {
          const isCompleted = completedStages.includes(stage);
          const isCurrent = stage === currentStage;
          const isPending = pendingStages.includes(stage);

          return (
            <Box
              key={stage}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1,
                px: 2,
                mb: 0.5,
                borderRadius: 1,
                bgcolor:
                  isCompleted || isApproved
                    ? "success.50"
                    : isCurrent
                    ? "primary.50"
                    : "grey.50",
                border: "1px solid",
                borderColor:
                  isCompleted || isApproved
                    ? "success.200"
                    : isCurrent
                    ? "primary.200"
                    : "grey.200",
              }}
            >
              <Box sx={{ minWidth: 24, display: "flex", justifyContent: "center" }}>
                {isCompleted || isApproved ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : isCurrent ? (
                  <Clock size={20} color="#3b82f6" />
                ) : (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "grey.400",
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? "primary.main" : "text.primary",
                }}
              >
                {formatStageName(stage)}
              </Typography>
              {isCompleted || isApproved ? (
                <Chip label="Completed" size="small" color="success" />
              ) : isCurrent ? (
                <Chip label="Current" size="small" color="primary" />
              ) : (
                <Chip label="Pending" size="small" variant="outlined" />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

