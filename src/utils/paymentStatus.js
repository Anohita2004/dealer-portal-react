/**
 * Payment Status Utilities
 * Explains payment workflow stages, pending reasons, and required actions
 * Based on backend payment workflow intelligence
 */

/**
 * Get payment pending reason explanation
 * @param {object} payment - Payment object from backend
 * @param {object} workflow - Workflow object from backend
 * @returns {object} { reason, nextAction, isBlocked }
 */
export const getPaymentPendingReason = (payment, workflow) => {
  const approvalStatus = (workflow?.approvalStatus || payment.approvalStatus || payment.status || "").toLowerCase();
  const currentStage = workflow?.currentStage || payment.approvalStage || payment.currentStage;
  const pendingStages = workflow?.pendingStages || [];

  // If not pending, return null
  if (approvalStatus !== "pending") {
    return null;
  }

  // Format stage name
  const formatStageName = (stage) => {
    if (!stage) return "Unknown";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  let reason = "Payment is pending approval";
  let nextAction = "Waiting for approval";
  let isBlocked = true;

  // Check if proof is missing
  if (!payment.proofFile && !payment.proofUrl) {
    return {
      reason: "Proof document is required",
      nextAction: "Upload payment proof document to proceed",
      isBlocked: true,
      blockingType: "missing_proof",
    };
  }

  // Check current stage
  if (currentStage) {
    reason = `Awaiting ${formatStageName(currentStage)} approval`;
    nextAction = `Waiting for ${formatStageName(currentStage)} to review and approve`;
    
    if (pendingStages.length > 0) {
      nextAction = `Next: ${formatStageName(pendingStages[0])} will review after ${formatStageName(currentStage)} approval`;
    }
  }

  // Check for finance remarks that might indicate issues
  if (payment.financeRemarks) {
    const remarksLower = payment.financeRemarks.toLowerCase();
    if (remarksLower.includes("discrepancy") || remarksLower.includes("mismatch")) {
      return {
        reason: "Finance has noted a discrepancy",
        nextAction: "Review finance remarks and resolve the issue",
        isBlocked: true,
        blockingType: "finance_discrepancy",
        details: payment.financeRemarks,
      };
    }
  }

  // Check reconciliation status
  if (payment.reconciliationStatus === "discrepancy") {
    return {
      reason: "Reconciliation discrepancy detected",
      nextAction: "Review reconciliation notes and resolve the discrepancy",
      isBlocked: true,
      blockingType: "reconciliation_discrepancy",
      details: payment.reconciliationNotes || "Payment amount or details do not match records",
    };
  }

  return {
    reason,
    nextAction,
    isBlocked,
    currentStage,
    nextStage: pendingStages.length > 0 ? pendingStages[0] : null,
  };
};

/**
 * Get required next action for payment
 * @param {object} payment - Payment object
 * @param {object} workflow - Workflow object
 * @param {string} userRole - Current user's role
 * @returns {string|null} Next action description
 */
export const getRequiredNextAction = (payment, workflow, userRole) => {
  const pendingReason = getPaymentPendingReason(payment, workflow);
  if (!pendingReason) return null;

  // If user's role matches current stage, they can act
  const roleToStage = {
    dealer_admin: "dealer_admin",
    territory_manager: "territory_manager",
    area_manager: "area_manager",
    regional_manager: "regional_manager",
    regional_admin: "regional_admin",
    finance_admin: "finance_admin",
  };

  const userStage = roleToStage[userRole];
  const currentStage = workflow?.currentStage || payment.approvalStage;

  if (userStage === currentStage && workflow?.approvalStatus === "pending") {
    return "You can approve or reject this payment";
  }

  return pendingReason.nextAction;
};

/**
 * Get payment status display info
 * @param {object} payment - Payment object
 * @param {object} workflow - Workflow object (optional)
 * @returns {object} { label, color, description, icon }
 */
export const getPaymentStatusDisplay = (payment, workflow) => {
  const approvalStatus = (workflow?.approvalStatus || payment.approvalStatus || payment.status || "").toLowerCase();
  const reconciliationStatus = payment.reconciliationStatus;

  // Reconciliation takes precedence for display
  if (reconciliationStatus === "discrepancy") {
    return {
      label: "Reconciliation Discrepancy",
      color: "error",
      description: "Payment has reconciliation issues that need to be resolved",
      icon: "error",
    };
  }

  if (reconciliationStatus === "reconciled") {
    return {
      label: "Reconciled",
      color: "success",
      description: "Payment has been successfully reconciled",
      icon: "success",
    };
  }

  // Approval status
  if (approvalStatus === "approved") {
    return {
      label: "Approved",
      color: "success",
      description: "Payment has been approved and is being processed",
      icon: "success",
    };
  }

  if (approvalStatus === "rejected") {
    return {
      label: "Rejected",
      color: "error",
      description: payment.rejectionReason || "Payment has been rejected",
      icon: "error",
    };
  }

  // Pending with stage info
  const currentStage = workflow?.currentStage || payment.approvalStage;
  if (currentStage) {
    const stageName = currentStage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    return {
      label: `Awaiting ${stageName}`,
      color: "warning",
      description: `Payment is pending approval at ${stageName} stage`,
      icon: "pending",
    };
  }

  return {
    label: "Pending",
    color: "warning",
    description: "Payment is pending approval",
    icon: "pending",
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

