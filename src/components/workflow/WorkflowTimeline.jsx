import React from "react";
import { Box, Typography, Avatar, Divider } from "@mui/material";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

/**
 * WorkflowTimeline Component
 * Displays complete approval history with timeline visualization
 */
export default function WorkflowTimeline({ timeline = [], workflow }) {
  if (!timeline || timeline.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No approval history available
        </Typography>
      </Box>
    );
  }

  // Format stage name for display
  const formatStageName = (stage) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get action icon and color
  const getActionIcon = (action) => {
    switch (action) {
      case "approved":
        return { Icon: CheckCircle, color: "#22c55e" };
      case "rejected":
        return { Icon: XCircle, color: "#ef4444" };
      case "submitted":
      default:
        return { Icon: Clock, color: "#3b82f6" };
    }
  };

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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Approval Timeline
      </Typography>

      <Box sx={{ position: "relative" }}>
        {/* Timeline Line */}
        <Box
          sx={{
            position: "absolute",
            left: "20px",
            top: "40px",
            bottom: "20px",
            width: "2px",
            bgcolor: "divider",
            zIndex: 0,
          }}
        />

        {/* Timeline Items */}
        {timeline.map((item, index) => {
          const { Icon, color } = getActionIcon(item.action);
          const timestamp = item.timestamp
            ? new Date(item.timestamp)
            : item.createdAt
            ? new Date(item.createdAt)
            : null;
          const actor = item.actor || {};
          const actorName =
            actor.username || actor.name || actor.email || item.approvedBy || "Unknown User";

          return (
            <Box
              key={item.id || index}
              sx={{
                display: "flex",
                mb: 3,
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Timeline Dot */}
              <Box sx={{ mr: 2, position: "relative" }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: color,
                    border: "2px solid",
                    borderColor: "background.paper",
                  }}
                >
                  <Icon size={20} color="white" />
                </Avatar>
              </Box>

              {/* Timeline Content */}
              <Box sx={{ flex: 1, pb: index < timeline.length - 1 ? 0 : 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {formatStageName(item.stage)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.action === "approved"
                        ? "Approved"
                        : item.action === "rejected"
                        ? "Rejected"
                        : "Submitted"}{" "}
                      by {actorName}
                    </Typography>
                  </Box>
                  {timestamp && (
                    <Typography variant="caption" color="text.secondary">
                      {format(timestamp, "MMM dd, yyyy HH:mm")}
                      <br />
                      <span style={{ fontSize: "0.7rem" }}>
                        ({formatDistanceToNow(timestamp, { addSuffix: true })})
                      </span>
                    </Typography>
                  )}
                </Box>

                {/* Remarks */}
                {item.remarks && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      "{item.remarks}"
                    </Typography>
                  </Box>
                )}

                {/* Rejection Reason */}
                {item.rejectionReason && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      bgcolor: "error.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "error.200",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main" }}>
                      Rejection Reason:
                    </Typography>
                    <Typography variant="caption" color="error.main" sx={{ display: "block", mt: 0.5 }}>
                      {item.rejectionReason}
                    </Typography>
                  </Box>
                )}

                {/* SLA Information */}
                {item.slaStart && item.slaEnd && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      SLA: {format(new Date(item.slaStart), "MMM dd, HH:mm")} -{" "}
                      {format(new Date(item.slaEnd), "MMM dd, HH:mm")}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

