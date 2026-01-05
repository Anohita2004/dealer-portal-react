/**
 * Invoice Status Utilities
 * Centralized logic for determining display status and styling for invoices
 */

export const getInvoiceStatusLabel = (invoice) => {
    if (!invoice) return "PENDING";

    // Priority 0: Check payment records (Immediate feedback for real-time updates)
    if (invoice.payments && Array.isArray(invoice.payments)) {
        const hasSuccessfulPayment = invoice.payments.some(p =>
            (p.status === 'approved' || p.status === 'paid' || p.isSuccessful === true || p.gatewayStatus === 'captured')
        );
        if (hasSuccessfulPayment) return "PAID";
    }

    // Priority 1: Settlement Status (Paid/Partial)
    if (invoice.status === "paid" || invoice.status === "Partial" || invoice.status === "partial") {
        return invoice.status.toUpperCase();
    }

    // Priority 2: Approval Status (Rejected)
    if (invoice.approvalStatus === "rejected" || invoice.status === "rejected") {
        return "REJECTED";
    }

    // Priority 3: Approval Workflow (Approved)
    if (invoice.approvalStatus === "approved" || invoice.status === "approved") {
        return "APPROVED";
    }

    // Priority 4: Specified Settlement (Unpaid/Overdue)
    if (invoice.status === "unpaid" || invoice.status === "overdue") {
        return invoice.status.toUpperCase();
    }

    // Fallback
    return (invoice.approvalStatus || invoice.status || "PENDING").toUpperCase();
};

export const getInvoiceStatusColor = (statusLabel) => {
    const status = statusLabel.toUpperCase();

    switch (status) {
        case "PAID":
        case "APPROVED":
            return "success";
        case "PARTIAL":
        case "PENDING":
            return "warning";
        case "REJECTED":
        case "OVERDUE":
            return "error";
        case "UNPAID":
            return "info";
        default:
            return "warning";
    }
};

/**
 * Check if the invoice was paid via integration
 * @param {object} invoice 
 * @returns {boolean}
 */
export const isPaidViaIntegration = (invoice) => {
    if (!invoice) return false;

    // Check if we have payment records with GATEWAY mode
    if (invoice.payments && Array.isArray(invoice.payments)) {
        return invoice.payments.some(p => p.paymentMode === 'GATEWAY' && (p.status === 'approved' || p.status === 'paid'));
    }

    // Some backends might flag it on the invoice itself
    return invoice.paymentMode === 'GATEWAY' || invoice.isGatewayPayment === true;
};
