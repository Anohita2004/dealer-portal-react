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
} from "@mui/material";
import { Search, Filter, FileText, Download } from "lucide-react";
import { invoiceAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useApiCall } from "../hooks/useApiCall";
import InvoiceApprovalCard from "../components/InvoiceApprovalCard";
import PageHeader from "../components/PageHeader";
import { WorkflowStatusBadge } from "../components/workflow";
import { useWorkflow } from "../hooks/useWorkflow";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

  const fetchInvoices = async () => {
    try {
      const data = await invoiceAPI.getInvoices();
      const invoicesList = Array.isArray(data) ? data : data.invoices || data.data || [];
      setInvoices(invoicesList);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      toast.error("Failed to load invoices");
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const data = await invoiceAPI.getPendingApprovals();
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
  }, [viewMode]);

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Status filter
    if (statusFilter === "pending" && invoice.status !== "pending" && invoice.approvalStatus !== "pending") {
      return false;
    }
    if (statusFilter === "approved" && invoice.status !== "approved" && invoice.approvalStatus !== "approved") {
      return false;
    }
    if (statusFilter === "rejected" && invoice.status !== "rejected" && invoice.approvalStatus !== "rejected") {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.dealer?.businessName?.toLowerCase().includes(query) ||
        invoice.dealerName?.toLowerCase().includes(query) ||
        invoice.id?.toString().includes(query)
      );
    }

    return true;
  });

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
          <Tab label="Rejected" value="rejected" />
        </Tabs>

        <Button
          variant="outlined"
          size="small"
          onClick={viewMode === "approvals" ? fetchPendingApprovals : fetchInvoices}
          startIcon={<Filter size={16} />}
        >
          Refresh
        </Button>
      </Box>

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
                : "No invoices found"}
            </Typography>
          </CardContent>
        </Card>
      ) : viewMode === "approvals" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredInvoices.map((invoice) => (
            <InvoiceApprovalCard
              key={invoice.id}
              invoice={invoice}
              onUpdate={fetchPendingApprovals}
            />
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
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
                    <tr key={invoice.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>{invoice.invoiceNumber || `#${invoice.id?.slice(0, 8)}`}</td>
                      <td style={{ padding: "12px" }}>
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        ₹{Number(invoice.totalAmount || invoice.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Chip
                          label={invoice.status?.toUpperCase() || "PENDING"}
                          color={
                            invoice.status === "approved"
                              ? "success"
                              : invoice.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <InvoiceWorkflowBadge invoiceId={invoice.id} />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          View
                        </Button>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                        ₹{Number(invoice.totalAmount || invoice.baseAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Chip
                          label={invoice.approvalStatus || invoice.status || "PENDING"}
                          color={
                            invoice.approvalStatus === "approved" || invoice.status === "approved"
                              ? "success"
                              : invoice.approvalStatus === "rejected" || invoice.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Button
                          size="small"
                          startIcon={<Download size={16} />}
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
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
