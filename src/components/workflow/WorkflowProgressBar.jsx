import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

/**
 * WorkflowProgressBar Component
 * Visual progress bar showing pipeline stages with color coding
 */
export default function WorkflowProgressBar({ workflow, onClickStage }) {
  if (!workflow) {
    return null;
  }

  const {
    pipeline = [],
    currentStage,
    completedStages = [],
    pendingStages = [],
    approvalStatus = "pending",
    currentSlaExpiresAt,
  } = workflow;

  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";

  // Format stage name for display
  const formatStageName = (stage) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get stage status
  const getStageStatus = (stage) => {
    if (isRejected && stage === currentStage) {
      return { status: "rejected", color: "#ef4444", bgColor: "#fee2e2" };
    }
    if (isApproved || completedStages.includes(stage)) {
      return { status: "completed", color: "#22c55e", bgColor: "#dcfce7" };
    }
    if (stage === currentStage) {
      return { status: "current", color: "#3b82f6", bgColor: "#dbeafe" };
    }
    return { status: "pending", color: "#9ca3af", bgColor: "#f3f4f6" };
  };

  // Calculate SLA status
  const getSLAStatus = () => {
    if (!currentSlaExpiresAt || !currentStage) return null;
    const expiresAt = new Date(currentSlaExpiresAt);
    const now = new Date();
    const isOverdue = expiresAt < now;
    return { isOverdue, expiresAt };
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Approval Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% Complete
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ position: "relative", mb: 3 }}>
        <Box
          sx={{
            width: "100%",
            height: 8,
            bgcolor: "grey.200",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: "100%",
              bgcolor: isApproved ? "success.main" : isRejected ? "error.main" : "primary.main",
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>

      {/* Stages */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
          mb: 2,
        }}
      >
        {/* Connecting Line */}
        <Box
          sx={{
            position: "absolute",
            top: "20px",
            left: 0,
            right: 0,
            height: "2px",
            bgcolor: "divider",
            zIndex: 0,
          }}
        />

        {pipeline.map((stage, index) => {
          const stageStatus = getStageStatus(stage);
          const isCurrent = stage === currentStage;
          const isClickable = onClickStage !== undefined;

          const StageContent = (
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: isClickable ? "pointer" : "default",
                transition: "transform 0.2s",
                "&:hover": isClickable
                  ? {
                      transform: "scale(1.1)",
                    }
                  : {},
              }}
              onClick={() => isClickable && onClickStage(stage)}
            >
              {/* Stage Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: stageStatus.bgColor,
                  border: "3px solid",
                  borderColor: stageStatus.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                {stageStatus.status === "completed" ? (
                  <CheckCircle size={20} color={stageStatus.color} />
                ) : stageStatus.status === "rejected" ? (
                  <XCircle size={20} color={stageStatus.color} />
                ) : isCurrent ? (
                  <Clock size={20} color={stageStatus.color} />
                ) : (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: stageStatus.color,
                    }}
                  />
                )}
              </Box>

              {/* Stage Label */}
              <Typography
                variant="caption"
                sx={{
                  textAlign: "center",
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? "primary.main" : "text.secondary",
                  maxWidth: 100,
                }}
              >
                {formatStageName(stage)}
              </Typography>

              {/* Overdue Badge */}
              {isCurrent && slaStatus?.isOverdue && (
                <Box
                  sx={{
                    mt: 0.5,
                    px: 1,
                    py: 0.25,
                    bgcolor: "error.main",
                    color: "white",
                    borderRadius: 1,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <AlertCircle size={12} />
                  Overdue
                </Box>
              )}
            </Box>
          );

          if (isClickable) {
            return (
              <Tooltip key={stage} title={`Click to view ${formatStageName(stage)} details`}>
                {StageContent}
              </Tooltip>
            );
          }

          return <Box key={stage}>{StageContent}</Box>;
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CheckCircle size={16} color="#22c55e" />
          <Typography variant="caption">Completed</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Clock size={16} color="#3b82f6" />
          <Typography variant="caption">Current</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#9ca3af",
            }}
          />
          <Typography variant="caption">Pending</Typography>
        </Box>
        {isRejected && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <XCircle size={16} color="#ef4444" />
            <Typography variant="caption">Rejected</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

