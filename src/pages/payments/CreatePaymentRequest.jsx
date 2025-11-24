import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem
} from "@mui/material";
import api from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";

export default function CreatePaymentRequest() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    api.get(`/invoices/${invoiceId}`).then((res) => {
      setInvoice(res.data.invoice);
    });
  }, [invoiceId]);

  const submitRequest = async () => {
    if (!proofFile || !paymentMode) {
      return alert("Please upload proof & select payment mode.");
    }

    const formData = new FormData();
    formData.append("invoiceId", invoiceId);
    formData.append("amount", invoice.balanceAmount);
    formData.append("paymentMode", paymentMode);
    formData.append("utrNumber", utrNumber);
    formData.append("proofFile", proofFile);

    try {
      await api.post("/payments/request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Payment Request Sent to Dealer Admin!");
      navigate("/payments/mine");
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment request");
    }
  };

  if (!invoice) return <div>Loading...</div>;

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2}>
            Make Payment Request
          </Typography>

          <Typography>
            <strong>Invoice:</strong> {invoice.invoiceNumber}
          </Typography>
          <Typography>
            <strong>Pending Amount:</strong> ₹{invoice.balanceAmount}
          </Typography>

          <TextField
            fullWidth
            label="Payment Mode"
            select
            margin="normal"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <MenuItem value="NEFT">NEFT</MenuItem>
            <MenuItem value="RTGS">RTGS</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="CHEQUE">Cheque</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="UTR Number (optional)"
            margin="normal"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
          />

          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Payment Proof
            <input
              type="file"
              hidden
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files[0])}
            />
          </Button>

          {proofFile && <Typography mt={1}>{proofFile.name}</Typography>}

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 4 }}
            onClick={submitRequest}
          >
            Submit Payment Request
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
