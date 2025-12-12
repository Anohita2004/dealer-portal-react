import React from "react";
import { Chip, Tooltip } from "@mui/material";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * WorkflowStatusBadge Component
 * Displays workflow status badge with SLA information for list views
 */
export default function WorkflowStatusBadge({ workflow, entityType, showSLA = true }) {
  if (!workflow) {
    return <Chip label="Loading..." size="small" variant="outlined" />;
  }

  const {
    approvalStatus = "pending",
    currentStage,
    currentSlaExpiresAt,
    isFinal = false,
  } = workflow;

  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const isPending = approvalStatus === "pending";

  // Format stage name
  const formatStageName = (stage) => {
    if (!stage) return "";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate SLA status
  const getSLAStatus = () => {
    if (!currentSlaExpiresAt || !currentStage) return null;

    const expiresAt = new Date(currentSlaExpiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;
    const isOverdue = diffMs < 0;
    const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isOverdue,
      diffHours,
      diffMinutes,
      expiresAt,
    };
  };

  const slaStatus = getSLAStatus();

  // Get badge color and icon
  const getBadgeProps = () => {
    if (isApproved) {
      return {
        color: "success",
        icon: <CheckCircle size={14} />,
        label: "Approved",
      };
    }
    if (isRejected) {
      return {
        color: "error",
        icon: <XCircle size={14} />,
        label: "Rejected",
      };
    }
    if (slaStatus?.isOverdue) {
      return {
        color: "error",
        icon: <AlertCircle size={14} />,
        label: `${formatStageName(currentStage)} - Overdue`,
      };
    }
    if (slaStatus?.isDueSoon) {
      return {
        color: "warning",
        icon: <Clock size={14} />,
        label: `${formatStageName(currentStage)} - Due Soon`,
      };
    }
    return {
      color: "warning",
      icon: <Clock size={14} />,
      label: formatStageName(currentStage) || "Pending",
    };
  };

  const badgeProps = getBadgeProps();
  const tooltipText = isPending && slaStatus
    ? `SLA expires ${slaStatus.isOverdue ? `${slaStatus.diffHours}h ${slaStatus.diffMinutes}m ago` : `in ${slaStatus.diffHours}h ${slaStatus.diffMinutes}m`}`
    : isApproved
    ? "Fully approved"
    : isRejected
    ? "Rejected"
    : "Pending approval";

  const Badge = (
    <Chip
      icon={badgeProps.icon}
      label={badgeProps.label}
      color={badgeProps.color}
      size="small"
      variant={isPending ? "outlined" : "filled"}
    />
  );

  if (showSLA && slaStatus) {
    return (
      <Tooltip title={tooltipText}>
        {Badge}
      </Tooltip>
    );
  }

  return Badge;
}

