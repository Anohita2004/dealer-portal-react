/**
 * Status Color Utilities
 * Maps backend enum values to UI colors
 * Ensures consistency with backend status definitions
 */

/**
 * Get color for approval status (pending, approved, rejected)
 * @param {string} status - Backend enum: "pending" | "approved" | "rejected"
 * @returns {string} Color code
 */
export const getApprovalStatusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "approved":
      return "#10b981"; // green
    case "rejected":
      return "#ef4444"; // red
    case "pending":
    default:
      return "#f59e0b"; // amber/warning
  }
};

/**
 * Get color for invoice/payment status (paid, unpaid, partial, overdue)
 * @param {string} status - Backend enum: "paid" | "unpaid" | "partial" | "overdue"
 * @returns {string} Color code
 */
export const getPaymentStatusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "paid":
      return "#10b981"; // green
    case "overdue":
      return "#ef4444"; // red
    case "partial":
      return "#f59e0b"; // amber
    case "unpaid":
    default:
      return "#6b7280"; // gray
  }
};

/**
 * Get CSS class for status (for use with existing styles)
 * @param {string} status - Status value
 * @param {string} type - "approval" | "payment"
 * @returns {string} CSS class name
 */
export const getStatusClass = (status, type = "approval") => {
  const normalized = (status || "").toLowerCase();
  
  if (type === "payment") {
    switch (normalized) {
      case "paid":
        return "status-approved";
      case "overdue":
        return "status-overdue";
      case "partial":
        return "status-partial";
      case "unpaid":
      default:
        return "status-pending";
    }
  }
  
  // Default: approval status
  switch (normalized) {
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    case "pending":
    default:
      return "status-pending";
  }
};

/**
 * Calculate SLA urgency from expiration timestamp
 * @param {string|Date} slaExpiresAt - SLA expiration timestamp
 * @returns {object} { isOverdue, isDueSoon, hoursRemaining, urgency }
 */
export const calculateSLAUrgency = (slaExpiresAt) => {
  if (!slaExpiresAt) return null;
  
  const expiresAt = new Date(slaExpiresAt);
  const now = new Date();
  const diffMs = expiresAt - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const isOverdue = diffMs < 0;
  const isDueSoon = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000; // Less than 24 hours
  
  let urgency = "normal";
  if (isOverdue) urgency = "critical";
  else if (isDueSoon) urgency = "high";
  
  return {
    isOverdue,
    isDueSoon,
    hoursRemaining: Math.abs(diffHours),
    minutesRemaining: Math.abs(diffMinutes),
    urgency,
    expiresAt,
  };
};

/**
 * Get urgency color based on SLA status
 * @param {object} slaUrgency - Result from calculateSLAUrgency
 * @returns {string} Color code
 */
export const getSLAUrgencyColor = (slaUrgency) => {
  if (!slaUrgency) return "#6b7280"; // gray
  
  if (slaUrgency.isOverdue) return "#ef4444"; // red
  if (slaUrgency.isDueSoon) return "#f59e0b"; // amber
  return "#3b82f6"; // blue
};

