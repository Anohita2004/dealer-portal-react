/**
 * Order Lifecycle Utilities
 * Maps backend order status and approval stage to lifecycle-aware statuses
 * Explains why orders are blocked and shows inventory impact
 */

/**
 * Get lifecycle-aware order status label
 * Combines order.status and approvalStatus to show meaningful state
 * @param {object} order - Order object from backend
 * @returns {object} { label, color, description, isBlocked, blockingReason }
 */
export const getOrderLifecycleStatus = (order) => {
  const status = (order.status || "").toLowerCase();
  const approvalStatus = (order.approvalStatus || "").toLowerCase();
  const approvalStage = order.approvalStage || order.currentStage;
  const blockingReason = order.blockingReason || order.rejectionReason;

  // If rejected, show rejection state
  if (approvalStatus === "rejected" || status === "rejected") {
    return {
      label: "Rejected",
      color: "error",
      description: blockingReason || "Order has been rejected",
      isBlocked: true,
      blockingReason: blockingReason || "Rejected during approval process",
      lifecycleStage: "rejected",
    };
  }

  // If cancelled, show cancelled state
  if (status === "cancelled" || status === "canceled") {
    return {
      label: "Cancelled",
      color: "default",
      description: "Order has been cancelled",
      isBlocked: true,
      blockingReason: order.cancellationReason || "Order was cancelled",
      lifecycleStage: "cancelled",
    };
  }

  // If fully approved, show lifecycle status
  if (approvalStatus === "approved" && status === "approved") {
    // Check for further lifecycle states
    if (status === "processing" || order.processingStatus === "processing") {
      return {
        label: "Processing",
        color: "info",
        description: "Order is being processed and prepared for fulfillment",
        isBlocked: false,
        lifecycleStage: "processing",
      };
    }
    if (status === "fulfilled" || order.fulfillmentStatus === "fulfilled") {
      return {
        label: "Fulfilled",
        color: "success",
        description: "Order has been fulfilled and delivered",
        isBlocked: false,
        lifecycleStage: "fulfilled",
      };
    }
    // Default approved state
    return {
      label: "Approved",
      color: "success",
      description: "Order approved and ready for processing",
      isBlocked: false,
      lifecycleStage: "approved",
    };
  }

  // If in approval workflow, show approval stage
  if (approvalStatus === "pending" || status === "pending") {
    if (approvalStage) {
      const stageName = approvalStage
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      return {
        label: `Awaiting ${stageName}`,
        color: "warning",
        description: `Order is pending approval at ${stageName} stage`,
        isBlocked: true,
        blockingReason: `Waiting for ${stageName} approval`,
        lifecycleStage: "pending_approval",
        approvalStage: approvalStage,
      };
    }
    
    // Generic pending
    return {
      label: "Pending Approval",
      color: "warning",
      description: "Order is pending approval",
      isBlocked: true,
      blockingReason: "Awaiting approval from manager",
      lifecycleStage: "pending_approval",
    };
  }

  // Draft state (if order hasn't been submitted)
  if (status === "draft" || status === "draft_order") {
    return {
      label: "Draft",
      color: "default",
      description: "Order is in draft state and not yet submitted",
      isBlocked: true,
      blockingReason: "Order has not been submitted for approval",
      lifecycleStage: "draft",
    };
  }

  // Submitted but not yet in workflow
  if (status === "submitted") {
    return {
      label: "Submitted",
      color: "info",
      description: "Order has been submitted and is entering approval workflow",
      isBlocked: false,
      lifecycleStage: "submitted",
    };
  }

  // Default fallback
  return {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    color: "default",
    description: `Order status: ${status || "unknown"}`,
    isBlocked: false,
    lifecycleStage: status || "unknown",
  };
};

/**
 * Get inventory impact preview from order
 * @param {object} order - Order object from backend
 * @returns {object|null} { items: [{ materialId, materialName, quantity, availableStock, willBeLow }] }
 */
export const getInventoryImpact = (order) => {
  if (!order.items || !Array.isArray(order.items)) return null;

  const impact = {
    items: order.items.map((item) => {
      const availableStock = item.material?.availableStock ?? item.availableStock ?? null;
      const quantity = item.quantity || item.qty || 0;
      const willBeLow = availableStock !== null && (availableStock - quantity) < 10;
      
      return {
        materialId: item.materialId,
        materialName: item.material?.name || item.materialName || "Unknown",
        quantity: quantity,
        availableStock: availableStock,
        willBeLow: willBeLow,
      };
    }),
    hasLowStock: false,
    totalItems: order.items.length,
  };

  impact.hasLowStock = impact.items.some((item) => item.willBeLow);

  return impact;
};

/**
 * Get linked invoices and payments info
 * @param {object} order - Order object from backend
 * @returns {object} { invoices: [], payments: [], hasLinked: boolean }
 */
export const getOrderLinks = (order) => {
  const invoices = order.linkedInvoices || order.invoices || [];
  const payments = order.linkedPayments || order.payments || [];

  return {
    invoices: Array.isArray(invoices) ? invoices : [],
    payments: Array.isArray(payments) ? payments : [],
    hasLinked: (invoices.length > 0 || payments.length > 0),
  };
};

/**
 * Format approval progress percentage
 * @param {object} workflow - Workflow object from backend
 * @returns {number} Progress percentage (0-100)
 */
export const getApprovalProgress = (workflow) => {
  if (!workflow) return 0;
  
  const { pipeline = [], completedStages = [], approvalStatus } = workflow;
  if (pipeline.length === 0) return 0;
  
  const isApproved = approvalStatus === "approved";
  const completed = completedStages.length + (isApproved ? 1 : 0);
  
  return Math.round((completed / pipeline.length) * 100);
};

