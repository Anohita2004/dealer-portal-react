import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Stack,
} from "@mui/material";
import { CheckCircle, XCircle } from "lucide-react";
import { orderAPI, invoiceAPI, documentAPI, pricingAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";

export default function AreaApprovals() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalType, setApprovalType] = useState(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      switch (activeTab) {
        case 0: // Orders
          const ordersData = await orderAPI.getPendingApprovals({ areaId: user.areaId });
          setOrders(ordersData.data || ordersData.orders || ordersData || []);
          break;
        case 1: // Invoices
          const invoicesData = await invoiceAPI.getPendingApprovals({ areaId: user.areaId });
          setInvoices(invoicesData.data || invoicesData.invoices || invoicesData || []);
          break;
        case 2: // Documents
          const docsData = await documentAPI.getManagerDocuments();
          setDocuments(docsData.data || docsData.documents || docsData || []);
          break;
        case 3: // Pricing
          const pricingData = await pricingAPI.getPending();
          setPricing(pricingData.data || pricingData.requests || pricingData || []);
          break;
      }
    } catch (error) {
      console.error("Failed to load approvals:", error);
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      switch (approvalType) {
        case "order":
          await orderAPI.approveOrder(selectedItem.id, { action: "approve", remarks });
          break;
        case "invoice":
          await invoiceAPI.approveInvoice(selectedItem.id, { action: "approve", remarks });
          break;
        case "document":
          await documentAPI.approveRejectDocument(selectedItem.id, { action: "approve", remarks });
          break;
        case "pricing":
          await pricingAPI.approve(selectedItem.id, { action: "approve", remarks });
          break;
      }
      toast.success("Approved successfully");
      setApprovalDialogOpen(false);
      setRemarks("");
      loadApprovals();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error(error.response?.data?.error || "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      switch (approvalType) {
        case "order":
          await orderAPI.rejectOrder(selectedItem.id, { action: "reject", reason: remarks, remarks });
          break;
        case "invoice":
          await invoiceAPI.rejectInvoice(selectedItem.id, { action: "reject", reason: remarks, remarks });
          break;
        case "document":
          await documentAPI.approveRejectDocument(selectedItem.id, { action: "reject", reason: remarks, remarks });
          break;
        case "pricing":
          await pricingAPI.reject(selectedItem.id, { action: "reject", reason: remarks, remarks });
          break;
      }
      toast.success("Rejected successfully");
      setApprovalDialogOpen(false);
      setRemarks("");
      loadApprovals();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error(error.response?.data?.error || "Failed to reject");
    }
  };

  const openApprovalDialog = (item, type) => {
    setSelectedItem(item);
    setApprovalType(type);
    setApprovalDialogOpen(true);
  };

  const renderOrders = () => (
    <DataTable
      columns={[
        { key: "orderNumber", label: "Order #" },
        { key: "dealer.businessName", label: "Dealer" },
        { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
        {
          key: "actions",
          label: "Actions",
          render: (_, row) => (
            <Box>
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "order"); }}>
                Approve
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<XCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "order"); }} sx={{ ml: 1 }}>
                Reject
              </Button>
            </Box>
          ),
        },
      ]}
      rows={orders}
      emptyMessage="No pending order approvals"
    />
  );

  const renderInvoices = () => (
    <DataTable
      columns={[
        { key: "invoiceNumber", label: "Invoice #" },
        { key: "dealer.businessName", label: "Dealer" },
        { key: "totalAmount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
        {
          key: "actions",
          label: "Actions",
          render: (_, row) => (
            <Box>
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "invoice"); }}>
                Approve
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<XCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "invoice"); }} sx={{ ml: 1 }}>
                Reject
              </Button>
            </Box>
          ),
        },
      ]}
      rows={invoices}
      emptyMessage="No pending invoice approvals"
    />
  );

  const renderDocuments = () => (
    <DataTable
      columns={[
        { key: "fileName", label: "Document" },
        { key: "dealer.businessName", label: "Dealer" },
        { key: "documentType", label: "Type" },
        {
          key: "actions",
          label: "Actions",
          render: (_, row) => (
            <Box>
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "document"); }}>
                Approve
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<XCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "document"); }} sx={{ ml: 1 }}>
                Reject
              </Button>
            </Box>
          ),
        },
      ]}
      rows={documents}
      emptyMessage="No pending document approvals"
    />
  );

  const renderPricing = () => (
    <DataTable
      columns={[
        { key: "product.name", label: "Product" },
        { key: "dealer.businessName", label: "Dealer" },
        { key: "oldPrice", label: "Old Price", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
        { key: "newPrice", label: "New Price", render: (v) => `₹${Number(v || 0).toLocaleString()}` },
        {
          key: "actions",
          label: "Actions",
          render: (_, row) => (
            <Box>
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "pricing"); }}>
                Approve
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<XCircle size={14} />} onClick={() => { setRemarks(""); openApprovalDialog(row, "pricing"); }} sx={{ ml: 1 }}>
                Reject
              </Button>
            </Box>
          ),
        },
      ]}
      rows={pricing}
      emptyMessage="No pending pricing approvals"
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Pending Approvals" subtitle="Review and approve pending items" />

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Orders" />
            <Tab label="Invoices" />
            <Tab label="Documents" />
            <Tab label="Pricing" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderOrders()}
              {activeTab === 1 && renderInvoices()}
              {activeTab === 2 && renderDocuments()}
              {activeTab === 3 && renderPricing()}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>Approve/Reject {approvalType}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={4} label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={{ mt: 2, minWidth: 400 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" sx={{ mr: 1 }}>Approve</Button>
          <Button onClick={handleReject} variant="contained" color="error">Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

