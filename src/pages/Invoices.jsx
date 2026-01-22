import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  Stack,
} from "@mui/material";
import { Search, Filter, FileText, Download, CheckSquare, Square } from "lucide-react";
import BulkActionBar from "../components/BulkActionBar";
import { invoiceAPI, paymentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useApiCall } from "../hooks/useApiCall";
import InvoiceApprovalCard from "../components/InvoiceApprovalCard";
import PageHeader from "../components/PageHeader";
import { WorkflowStatusBadge } from "../components/workflow";
import { useWorkflow } from "../hooks/useWorkflow";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdvancedFilterSidebar from "../components/AdvancedFilterSidebar";
import FilterChips from "../components/FilterChips";
import { useDebounce } from "../hooks/useDebounce";
import { onPaymentSuccess, offPaymentSuccess } from "../services/socket";
import { getInvoiceStatusLabel, getInvoiceStatusColor, isPaidViaIntegration } from "../utils/invoiceStatus";
import { CreditCard } from "lucide-react";

// Helper component for workflow badge in table
function InvoiceWorkflowBadge({ invoiceId }) {
  const { workflow } = useWorkflow("invoice", invoiceId);
  return <WorkflowStatusBadge workflow={workflow} entityType="invoice" />;
}

export default function Invoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get, loading } = useApiCall();
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [viewMode, setViewMode] = useState("list"); // list, approvals
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    totalAmount_min: "",
    totalAmount_max: "",
    balanceAmount_min: "",
    balanceAmount_max: "",
    invoiceDate_from: "",
    invoiceDate_to: "",
    status: [],
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const filterConfig = [
    {
      category: "Status",
      fields: [
        {
          id: "status",
          label: "Invoice Status",
          type: "multi-select",
          options: [
            { label: "Paid", value: "paid" },
            { label: "Unpaid", value: "unpaid" },
            { label: "Pending", value: "pending" },
            { label: "Partial", value: "partial" },
          ],
        },
      ],
    },
    {
      category: "Amount Range",
      fields: [
        { id: "totalAmount_min", label: "Min Total Amount", type: "number" },
        { id: "totalAmount_max", label: "Max Total Amount", type: "number" },
        { id: "balanceAmount_min", label: "Min Balance Amount", type: "number" },
        { id: "balanceAmount_max", label: "Max Balance Amount", type: "number" },
      ],
    },
    {
      category: "Timeline",
      fields: [
        { id: "invoiceDate_from", label: "From Date", type: "date" },
        { id: "invoiceDate_to", label: "To Date", type: "date" },
      ],
    },
  ];

  const handleRemoveFilter = (key, value) => {
    setFilters((prev) => {
      if (Array.isArray(prev[key])) {
        return { ...prev, [key]: prev[key].filter((v) => v !== value) };
      }
      return { ...prev, [key]: "" };
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      totalAmount_min: "",
      totalAmount_max: "",
      balanceAmount_min: "",
      balanceAmount_max: "",
      invoiceDate_from: "",
      invoiceDate_to: "",
      status: [],
    });
  };

  const fetchInvoices = async () => {
    try {
      const params = {
        search: debouncedSearch,
        ...filters,
        status: filters.status.length > 0 ? filters.status.join(",") : statusFilter !== 'all' ? statusFilter : undefined,
      };

      const data = await invoiceAPI.getInvoices(params);
      const invoicesList = Array.isArray(data) ? data : data.invoices || data.data || [];
      setInvoices(invoicesList);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      toast.error("Failed to load invoices");
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const params = {
        search: debouncedSearch,
        ...filters,
      };
      const data = await invoiceAPI.getPendingApprovals(params);
      const approvalsList = Array.isArray(data) ? data : data.invoices || data.data || [];
      setInvoices(approvalsList);
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
      toast.error("Failed to load pending approvals");
    }
  };

  useEffect(() => {
    if (viewMode === "approvals") {
      fetchPendingApprovals();
    } else {
      fetchInvoices();
    }
    setSelectedIds([]); // Clear selection when view mode changes
  }, [viewMode, statusFilter, debouncedSearch, JSON.stringify(filters)]);

  useEffect(() => {
    onPaymentSuccess((data) => {
      toast.success(`Payment Receipt: ₹${data.amount} for Order ${data.orderId || 'processed'}`);
      fetchInvoices();
    });

    return () => {
      offPaymentSuccess();
    };
  }, []);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    const notes = window.prompt("Enter approval notes (optional):", "Bulk approved from dashboard");
    if (notes === null) return;

    setBulkLoading(true);
    try {
      const res = await invoiceAPI.bulkApprove(selectedIds, notes);
      const { success, failed } = res.results || { success: selectedIds, failed: [] };

      if (failed.length > 0) {
        toast.warning(`Approved ${success.length} items, but ${failed.length} failed.`);
      } else {
        toast.success(`Successfully approved ${success.length} items.`);
      }

      viewMode === "approvals" ? fetchPendingApprovals() : fetchInvoices();
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk approval failed:", err);
      toast.error(err.response?.data?.error || "Bulk approval failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = () => {
    setBulkRejectOpen(true);
  };

  const submitBulkReject = async () => {
    if (!bulkRejectReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setBulkLoading(true);
    try {
      const res = await invoiceAPI.bulkReject(selectedIds, bulkRejectReason, bulkNotes);
      const { success, failed } = res.results || { success: selectedIds, failed: [] };

      if (failed.length > 0) {
        toast.warning(`Rejected ${success.length} items, but ${failed.length} failed.`);
      } else {
        toast.success(`Successfully rejected ${success.length} items.`);
      }

      setBulkRejectOpen(false);
      setBulkRejectReason("");
      setBulkNotes("");
      viewMode === "approvals" ? fetchPendingApprovals() : fetchInvoices();
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk rejection failed:", err);
      toast.error(err.response?.data?.error || "Bulk rejection failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePayment = async (invoice) => {
    try {
      // 1. Initiate Payment with Backend
      const response = await paymentAPI.initiateGatewayPayment({
        invoiceId: invoice.id,
        amount: invoice.balanceAmount || invoice.totalAmount || invoice.baseAmount
      });

      const { orderId, amount, currency, keyId, paymentRequestId } = response;

      // 2. Configure Razorpay Options
      const options = {
        key: keyId,
        amount: amount, // in paise
        currency: currency,
        name: "Dealer Management Portal",
        description: `Payment for Invoice ${invoice.invoiceNumber || invoice.id}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.info("Verifying payment...");
            await paymentAPI.verifyGatewayPayment({
              paymentRequestId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success("Payment verified successfully!");
            fetchInvoices();
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.warning("Payment successful but verification pending. Refreshing...");
            // Backup refetch after delay to allow webhook processing
            setTimeout(fetchInvoices, 2000);
          }
        },
        prefill: {
          name: user.username || user.name,
          email: user.email,
          contact: user.phoneNumber || ""
        },
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout modal closed");
          }
        }
      };

      // 3. Open Razorpay Modal
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error("Razorpay SDK not loaded. Please refresh.");
      }

    } catch (error) {
      console.error("Payment initiation failed", error);
      toast.error(error.response?.data?.error || "Failed to start payment");
    }
  };

  // No client-side filtering; backend enforces access control
  const filteredInvoices = invoices;

  const canApprove = ["dealer_admin", "territory_manager", "area_manager", "regional_manager", "regional_admin"].includes(user?.role);

  return (
    <Box p={3}>
      <PageHeader
        title="Invoices"
        subtitle={viewMode === "approvals" ? "Pending approvals for your review" : "View and manage all invoices"}
      />

      {/* Tabs for List vs Approvals */}
      {canApprove && (
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={viewMode}
            onChange={(e, newValue) => setViewMode(newValue)}
          >
            <Tab label="All Invoices" value="list" />
            <Tab label="Pending Approvals" value="approvals" />
          </Tabs>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />

        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          sx={{ flex: 1 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Paid" value="paid" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterDrawerOpen(true)}
          startIcon={<Filter size={16} />}
        >
          Advanced Filters
        </Button>
      </Box>

      {/* Filter Chips */}
      <FilterChips
        filters={filters}
        config={filterConfig}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Invoices List */}
      {loading ? (
        <Card>
          <CardContent>
            <Typography align="center" sx={{ py: 4 }}>Loading invoices...</Typography>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {searchQuery || statusFilter !== "all"
                ? "No invoices match your filters"
                : viewMode === "approvals"
                  ? "No pending approvals"
                  : (["dealer_admin", "dealer_staff"].includes(user?.role)
                      ? "No invoices available. Invoices are only visible after GR approval."
                      : "No invoices found")}
            </Typography>
          </CardContent>
        </Card>
      ) : viewMode === "approvals" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: selectedIds.length > 0 ? 10 : 0 }}>
          {filteredInvoices.map((invoice) => (
            <InvoiceApprovalCard
              key={invoice.id}
              invoice={invoice}
              onUpdate={fetchPendingApprovals}
              selectable={true}
              selected={selectedIds.includes(invoice.id)}
              onSelect={handleSelectRow}
            />
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ overflowX: "auto", pb: selectedIds.length > 0 ? 10 : 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredInvoices.length}
                        checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                        onChange={handleSelectAll}
                        size="small"
                      />
                    </th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Invoice #</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Dealer</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Workflow</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: selectedIds.includes(invoice.id) ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <Checkbox
                          checked={selectedIds.includes(invoice.id)}
                          onChange={() => handleSelectRow(invoice.id)}
                          size="small"
                        />
                      </td>
                      <td style={{ padding: "12px" }}>{invoice.invoiceNumber || `#${invoice.id?.slice(0, 8)}`}</td>
                      <td style={{ padding: "12px" }}>
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        ₹{Number(invoice.totalAmount || invoice.baseAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={getInvoiceStatusLabel(invoice)}
                            color={getInvoiceStatusColor(getInvoiceStatusLabel(invoice))}
                            size="small"
                          />
                          {isPaidViaIntegration(invoice) && (
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 600 }}>
                              <CreditCard size={12} /> Online
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <InvoiceWorkflowBadge invoiceId={invoice.id} />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            View
                          </Button>
                          {(invoice.status === "approved" || invoice.status === "unpaid") && (user.role === "dealer_admin" || user.role === "dealer_staff"|| user.role === "sales_executive") && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handlePayment(invoice)}
                            >
                              Pay Now
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={async () => {
                              try {
                                const response = await invoiceAPI.downloadInvoicePDF(invoice.id);
                                const url = window.URL.createObjectURL(new Blob([response]));
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
                                a.click();
                                toast.success("PDF downloaded");
                              } catch (err) {
                                toast.error("Failed to download PDF");
                              }
                            }}
                          >
                            <Download size={16} />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}

      <BulkActionBar
        count={selectedIds.length}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        loading={bulkLoading}
      />

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectOpen} onClose={() => !bulkLoading && setBulkRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Selected Invoices ({selectedIds.length})</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              select
              label="Rejection Reason"
              required
              fullWidth
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="Incorrect Amount">Incorrect Amount</option>
              <option value="Missing Information">Missing Information</option>
              <option value="Duplicate Invoice">Duplicate Invoice</option>
              <option value="Invalid Order Reference">Invalid Order Reference</option>
              <option value="Other">Other</option>
            </TextField>
            <TextField
              label="Additional Notes"
              multiline
              rows={3}
              fullWidth
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              placeholder="Provide more details for the rejection..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkRejectOpen(false)} disabled={bulkLoading}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={submitBulkReject}
            disabled={!bulkRejectReason || bulkLoading}
          >
            Reject All
          </Button>
        </DialogActions>
      </Dialog>
      <AdvancedFilterSidebar
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onClear={handleClearAllFilters}
        config={filterConfig}
      />
    </Box>
  );
}
