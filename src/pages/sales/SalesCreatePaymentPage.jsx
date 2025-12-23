import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { useMyDealers } from "../../hooks/useMyDealers";
import { invoiceAPI, paymentAPI } from "../../services/api";
import { toast } from "react-toastify";

export default function SalesCreatePaymentPage() {
  const { dealers } = useMyDealers();

  const [dealerId, setDealerId] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const [loadingInv, setLoadingInv] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dealerId) {
      setInvoices([]);
      setInvoiceId("");
      return;
    }

    const load = async () => {
      setLoadingInv(true);
      try {
        const data = await invoiceAPI.getInvoices({ dealerId });
        const list = Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data)
          ? data
          : data?.data || [];
        setInvoices(list);
      } catch (err) {
        console.error("Failed to load dealer invoices:", err);
        toast.error(
          err?.response?.data?.error || "Failed to load invoices for dealer"
        );
        setInvoices([]);
      } finally {
        setLoadingInv(false);
      }
    };

    load();
  }, [dealerId]);

  useEffect(() => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setAmount(Number(inv.balanceAmount || inv.totalAmount || 0));
    }
  }, [invoiceId, invoices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealerId || !invoiceId) {
      toast.error("Please select dealer and invoice");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("dealerId", dealerId);
      formData.append("invoiceId", invoiceId);
      formData.append("amount", String(amount));
      formData.append("paymentMode", paymentMode);
      if (utrNumber) formData.append("utrNumber", utrNumber);
      if (proofFile) formData.append("proofFile", proofFile);

      await paymentAPI.createRequest(formData);
      toast.success("Payment request submitted");
      setInvoiceId("");
      setAmount(0);
      setUtrNumber("");
      setProofFile(null);
    } catch (err) {
      console.error("Failed to submit payment request:", err);
      toast.error(
        err?.response?.data?.error || "Failed to submit payment request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Create Payment Request"
        subtitle="Submit a payment request for an invoice of your assigned dealers"
      />

      <Card>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {/* Dealer */}
            <TextField
              select
              label="Dealer"
              value={dealerId}
              onChange={(e) => {
                setDealerId(e.target.value);
                setInvoiceId("");
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">Select dealer</MenuItem>
              {dealers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.dealerCode} — {d.businessName}
                </MenuItem>
              ))}
            </TextField>

            {/* Invoice */}
            <TextField
              select
              label="Invoice"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              fullWidth
              size="small"
              disabled={!dealerId || loadingInv}
              helperText={
                loadingInv
                  ? "Loading invoices…"
                  : "Only invoices for the selected dealer are shown"
              }
            >
              <MenuItem value="">Select invoice</MenuItem>
              {invoices.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.invoiceNumber || inv.id} — balance{" "}
                  {inv.balanceAmount || inv.totalAmount}
                </MenuItem>
              ))}
            </TextField>

            {/* Amount */}
            <TextField
              type="number"
              label="Amount"
              size="small"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              inputProps={{ step: "0.01", min: 0 }}
            />

            {/* Payment mode */}
            <TextField
              select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="NEFT">NEFT</MenuItem>
              <MenuItem value="RTGS">RTGS</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
            </TextField>

            {/* UTR */}
            <TextField
              label="UTR Number (optional)"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              fullWidth
              size="small"
            />

            {/* Proof file */}
            <Button variant="outlined" component="label" size="small">
              {proofFile ? "Change Proof File" : "Upload Proof File (optional)"}
              <input
                type="file"
                hidden
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </Button>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Payment Request"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


