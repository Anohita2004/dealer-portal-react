import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  ShoppingCart,
  Tag,
} from "lucide-react";
import {
  pricingAPI,
  orderAPI,
  paymentAPI,
  invoiceAPI,
} from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ApprovalWorkflow from "../../components/ApprovalWorkflow";
import DataTable from "../../components/DataTable";

export default function RegionalApprovals() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Approval data
  const [pricingRequests, setPricingRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalType, setApprovalType] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 0: // Pricing
          await loadPricingApprovals();
          break;
        case 1: // Orders
          await loadOrderApprovals();
          break;
        case 2: // Payments
          await loadPaymentApprovals();
          break;
        case 3: // Invoices
          await loadInvoiceApprovals();
          break;
      }
    } catch (error) {
      console.error("Failed to load approvals:", error);
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const loadPricingApprovals = async () => {
    try {
      // Regional admin approves at stage 2 (after area_manager)
      const data = await pricingAPI.getPending();
      setPricingRequests(data.data || data || []);
    } catch (error) {
      console.error("Failed to load pricing approvals:", error);
    }
  };

  const loadOrderApprovals = async () => {
    try {
      // Regional admin approves at stage 3 (after territory_manager and area_manager)
      const data = await orderAPI.getPendingApprovals();
      const allOrders = data.data || data || [];
      // Filter orders at stage 3 (regional_manager/regional_admin stage)
      const stage3Orders = allOrders.filter(
        (order) => order.approvalStage === "regional_manager" || order.approvalStage === "regional_admin"
      );
      setOrders(stage3Orders);
    } catch (error) {
      console.error("Failed to load order approvals:", error);
    }
  };

  const loadPaymentApprovals = async () => {
    try {
      // Payments are workflow-driven - use finance pending endpoint
      // If that doesn't work, try dealer pending
      let data;
      try {
        data = await paymentAPI.getFinancePending();
      } catch (e) {
        if (e?.response?.status === 404 || e?.response?.status === 403) {
          try {
            data = await paymentAPI.getDealerPending();
          } catch (e2) {
            // Both endpoints failed - user doesn't have access
            setPayments([]);
            return;
          }
        } else {
          throw e;
        }
      }
      const paymentsList = Array.isArray(data) ? data : data.payments || data.data || [];
      // Filter for pending status client-side
      setPayments(paymentsList.filter(p => p.status === "pending" || p.approvalStatus === "pending"));
    } catch (error) {
      // 404/403 = endpoint doesn't exist or role restriction - handle gracefully
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        setPayments([]);
        return;
      }
      // Only log non-permission errors
      console.error("Failed to load payment approvals:", error);
      setPayments([]);
    }
  };

  const loadInvoiceApprovals = async () => {
    try {
      const data = await invoiceAPI.getPendingApprovals();
      const allInvoices = data.data || data || [];
      // Filter invoices that need regional admin approval
      const regionalInvoices = allInvoices.filter(
        (invoice) => invoice.approvalStage === "regional_admin"
      );
      setInvoices(regionalInvoices);
    } catch (error) {
      console.error("Failed to load invoice approvals:", error);
    }
  };

  const handleApprove = (item, type) => {
    setSelectedItem(item);
    setApprovalType(type);
    setRemarks("");
    setIsRejecting(false);
    setApprovalDialogOpen(true);
  };

  const handleReject = (item, type) => {
    setSelectedItem(item);
    setApprovalType(type);
    setRemarks("");
    setIsRejecting(true);
    setApprovalDialogOpen(true);
  };

  const confirmApproval = async () => {
    try {
      const payload = {
        action: "approve",
        remarks: remarks || undefined,
      };

      switch (approvalType) {
        case "pricing":
          await pricingAPI.approve(selectedItem.id, payload);
          toast.success("Pricing request approved");
          break;
        case "order":
          await orderAPI.approveOrder(selectedItem.id, payload);
          toast.success("Order approved");
          break;
        case "payment":
          await paymentAPI.approveByFinance(selectedItem.id, payload);
          toast.success("Payment approved");
          break;
        case "invoice":
          await invoiceAPI.approveInvoice(selectedItem.id, payload);
          toast.success("Invoice approved");
          break;
      }

      setApprovalDialogOpen(false);
      loadApprovals();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error(error.response?.data?.error || "Failed to approve");
    }
  };

  const confirmRejection = async () => {
    try {
      const payload = {
        action: "reject",
        remarks: remarks || "Rejected by regional admin",
      };

      switch (approvalType) {
        case "pricing":
          await pricingAPI.reject(selectedItem.id, payload);
          toast.success("Pricing request rejected");
          break;
        case "order":
          await orderAPI.rejectOrder(selectedItem.id, payload);
          toast.success("Order rejected");
          break;
        case "payment":
          await paymentAPI.rejectByFinance(selectedItem.id, payload);
          toast.success("Payment rejected");
          break;
        case "invoice":
          await invoiceAPI.approveInvoice(selectedItem.id, payload);
          toast.success("Invoice rejected");
          break;
      }

      setApprovalDialogOpen(false);
      loadApprovals();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error(error.response?.data?.error || "Failed to reject");
    }
  };

  const renderPricingApprovals = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <DataTable
        columns={[
          { key: "productName", label: "Product" },
          { key: "oldPrice", label: "Old Price", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
          { key: "newPrice", label: "New Price", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
          { key: "dealer.businessName", label: "Dealer" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => handleApprove(row, "pricing")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={16} />}
                  onClick={() => handleReject(row, "pricing")}
                >
                  Reject
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={pricingRequests}
        emptyMessage="No pending pricing approvals"
      />
    );
  };

  const renderOrderApprovals = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <DataTable
        columns={[
          { key: "orderNumber", label: "Order #" },
          { key: "dealer.businessName", label: "Dealer" },
          { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
          { key: "approvalStage", label: "Stage" },
          { key: "status", label: "Status" },
          {
            key: "workflow",
            label: "Workflow",
            render: (_, row) => (
              <ApprovalWorkflow
                entity={{ type: "order", ...row }}
                currentStage={row.approvalStage}
                approvalStatus={row.status}
                showActions={false}
              />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => handleApprove(row, "order")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={16} />}
                  onClick={() => handleReject(row, "order")}
                >
                  Reject
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={orders}
        emptyMessage="No pending order approvals"
      />
    );
  };

  const renderPaymentApprovals = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <DataTable
        columns={[
          { key: "invoiceNumber", label: "Invoice #" },
          { key: "dealer.businessName", label: "Dealer" },
          { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
          { key: "paymentMethod", label: "Method" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => handleApprove(row, "payment")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={16} />}
                  onClick={() => handleReject(row, "payment")}
                >
                  Reject
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={payments}
        emptyMessage="No pending payment approvals"
      />
    );
  };

  const renderInvoiceApprovals = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <DataTable
        columns={[
          { key: "invoiceNumber", label: "Invoice #" },
          { key: "dealer.businessName", label: "Dealer" },
          { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
          { key: "approvalStage", label: "Stage" },
          { key: "status", label: "Status" },
          {
            key: "workflow",
            label: "Workflow",
            render: (_, row) => (
              <ApprovalWorkflow
                entity={{ type: "invoice", ...row }}
                currentStage={row.approvalStage}
                approvalStatus={row.status}
                showActions={false}
              />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => handleApprove(row, "invoice")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={16} />}
                  onClick={() => handleReject(row, "invoice")}
                >
                  Reject
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={invoices}
        emptyMessage="No pending invoice approvals"
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderPricingApprovals();
      case 1:
        return renderOrderApprovals();
      case 2:
        return renderPaymentApprovals();
      case 3:
        return renderInvoiceApprovals();
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    const action = isRejecting ? "Reject" : "Approve";
    const typeMap = {
      pricing: "Pricing Request",
      order: "Order",
      payment: "Payment",
      invoice: "Invoice",
    };
    return `${action} ${typeMap[approvalType] || "Item"}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Approvals"
        subtitle="Review and approve requests in your region"
      />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tag size={16} />
                  <span>Pricing ({pricingRequests.length})</span>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShoppingCart size={16} />
                  <span>Orders ({orders.length})</span>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <DollarSign size={16} />
                  <span>Payments ({payments.length})</span>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <FileText size={16} />
                  <span>Invoices ({invoices.length})</span>
                </Stack>
              }
            />
          </Tabs>
        </Box>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                {approvalType === "pricing" && (
                  <>
                    Product: {selectedItem.productName || "N/A"}
                    <br />
                    Old Price: ₹{Number(selectedItem.oldPrice || 0).toLocaleString()}
                    <br />
                    New Price: ₹{Number(selectedItem.newPrice || 0).toLocaleString()}
                  </>
                )}
                {approvalType === "order" && (
                  <>
                    Order: {selectedItem.orderNumber}
                    <br />
                    Amount: ₹{Number(selectedItem.totalAmount || 0).toLocaleString()}
                  </>
                )}
                {(approvalType === "payment" || approvalType === "invoice") && (
                  <>
                    {approvalType === "invoice" ? "Invoice" : "Payment"}: {selectedItem.invoiceNumber || selectedItem.id}
                    <br />
                    Amount: ₹{Number(selectedItem.amount || selectedItem.totalAmount || 0).toLocaleString()}
                  </>
                )}
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks or comments..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={isRejecting ? confirmRejection : confirmApproval}
            variant="contained"
            color={isRejecting ? "error" : "success"}
          >
            {isRejecting ? "Reject" : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

