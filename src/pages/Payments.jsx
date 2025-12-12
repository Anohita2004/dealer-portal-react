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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import { Search, Filter, FileText, Plus, Upload } from "lucide-react";
import { paymentAPI, invoiceAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useApiCall } from "../hooks/useApiCall";
import PaymentApprovalCard from "../components/PaymentApprovalCard";
import PageHeader from "../components/PageHeader";
import { toast } from "react-toastify";

export default function Payments() {
  const { user } = useAuth();
  const { post, get, loading } = useApiCall();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list, approvals, create
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Create payment form state
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const fetchPayments = async () => {
    try {
      const data = await paymentAPI.getMyRequests();
      const paymentsList = Array.isArray(data) ? data : data.payments || data.data || [];
      setPayments(paymentsList);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("Failed to load payments");
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      let data;
      if (user?.role === "dealer_admin") {
        data = await paymentAPI.getDealerPending();
      } else if (user?.role === "finance_admin") {
        data = await paymentAPI.getFinancePending();
      } else {
        data = await paymentAPI.getAllPayments();
      }
      const approvalsList = Array.isArray(data) ? data : data.payments || data.data || [];
      setPayments(approvalsList);
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
      toast.error("Failed to load pending approvals");
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await invoiceAPI.getInvoices();
      const invoicesList = Array.isArray(data) ? data : data.invoices || data.data || [];
      // Filter only approved invoices
      setInvoices(invoicesList.filter(inv => inv.status === "approved" || inv.approvalStatus === "approved"));
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    }
  };

  useEffect(() => {
    if (viewMode === "approvals") {
      fetchPendingApprovals();
    } else {
      fetchPayments();
    }
    if (createDialogOpen) {
      fetchInvoices();
    }
  }, [viewMode, createDialogOpen]);

  const canApprove = ["dealer_admin", "finance_admin", "regional_admin", "super_admin"].includes(user?.role);
  const canCreate = ["dealer_staff", "dealer_admin"].includes(user?.role);

  const handleCreatePayment = async () => {
    if (!selectedInvoice || !amount || !proofFile) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("invoiceId", selectedInvoice);
      formData.append("amount", amount);
      formData.append("paymentMode", paymentMode);
      if (utrNumber) formData.append("utrNumber", utrNumber);
      formData.append("proofFile", proofFile);

      await paymentAPI.createRequest(formData);
      toast.success("Payment request created successfully");
      setCreateDialogOpen(false);
      setSelectedInvoice("");
      setAmount("");
      setPaymentMode("NEFT");
      setUtrNumber("");
      setProofFile(null);
      fetchPayments();
    } catch (err) {
      console.error("Failed to create payment:", err);
      toast.error(err.response?.data?.error || "Failed to create payment request");
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Status filter
    if (statusFilter === "pending" && payment.status !== "pending" && payment.approvalStatus !== "pending") {
      return false;
    }
    if (statusFilter === "approved" && payment.status !== "approved" && payment.approvalStatus !== "approved") {
      return false;
    }
    if (statusFilter === "rejected" && payment.status !== "rejected" && payment.approvalStatus !== "rejected") {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.id?.toString().includes(query) ||
        payment.invoice?.invoiceNumber?.toLowerCase().includes(query) ||
        payment.invoiceId?.toString().includes(query) ||
        payment.utrNumber?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <Box p={3}>
      <PageHeader
        title="Payments"
        subtitle={viewMode === "approvals" ? "Pending payment approvals" : "View and manage payment requests"}
      />

      {/* Tabs */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tabs
          value={viewMode}
          onChange={(e, newValue) => setViewMode(newValue)}
        >
          <Tab label="My Payments" value="list" />
          {canApprove && <Tab label="Pending Approvals" value="approvals" />}
        </Tabs>
        {canCreate && viewMode === "list" && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Payment Request
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search payments..."
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
          <Tab label="Rejected" value="rejected" />
        </Tabs>

        <Button
          variant="outlined"
          size="small"
          onClick={viewMode === "approvals" ? fetchPendingApprovals : fetchPayments}
          startIcon={<Filter size={16} />}
        >
          Refresh
        </Button>
      </Box>

      {/* Payments List */}
      {loading ? (
        <Card>
          <CardContent>
            <Typography align="center" sx={{ py: 4 }}>Loading payments...</Typography>
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {searchQuery || statusFilter !== "all"
                ? "No payments match your filters"
                : viewMode === "approvals"
                ? "No pending approvals"
                : "No payments found"}
            </Typography>
          </CardContent>
        </Card>
      ) : viewMode === "approvals" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredPayments.map((payment) => (
            <PaymentApprovalCard
              key={payment.id}
              payment={payment}
              onUpdate={fetchPendingApprovals}
              userRole={user?.role}
            />
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Payment ID</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Invoice</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Mode</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>#{payment.id?.slice(0, 8)}</td>
                      <td style={{ padding: "12px" }}>
                        {payment.invoice?.invoiceNumber || payment.invoiceId || "N/A"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                        ₹{Number(payment.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {payment.paymentMode || "N/A"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Chip
                          label={payment.approvalStatus || payment.status || "PENDING"}
                          color={
                            payment.approvalStatus === "approved" || payment.status === "approved"
                              ? "success"
                              : payment.approvalStatus === "rejected" || payment.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Create Payment Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payment Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Select Invoice"
            value={selectedInvoice}
            onChange={(e) => {
              setSelectedInvoice(e.target.value);
              const invoice = invoices.find(inv => inv.id === e.target.value);
              if (invoice) {
                setAmount(invoice.totalAmount || invoice.baseAmount || "");
              }
            }}
            margin="normal"
            required
          >
            {invoices.map((invoice) => (
              <MenuItem key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} - ₹{Number(invoice.totalAmount || invoice.baseAmount || 0).toLocaleString()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
            required
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <TextField
            fullWidth
            select
            label="Payment Mode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            margin="normal"
            required
          >
            <MenuItem value="NEFT">NEFT</MenuItem>
            <MenuItem value="RTGS">RTGS</MenuItem>
            <MenuItem value="CHEQUE">CHEQUE</MenuItem>
            <MenuItem value="CASH">CASH</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="UTR Number (Optional)"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            margin="normal"
            placeholder="Enter UTR/Reference number"
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Payment Proof (Required)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload size={18} />}
              fullWidth
            >
              {proofFile ? proofFile.name : "Upload Proof"}
              <input
                type="file"
                hidden
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files[0])}
              />
            </Button>
            {proofFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Selected: {proofFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePayment}
            disabled={!selectedInvoice || !amount || !proofFile}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

