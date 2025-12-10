// src/pages/payments/CreatePaymentRequest.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function CreatePaymentRequest() {
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [utr, setUtr] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ========================================================================
  // LOAD INVOICES
  // ========================================================================
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await api.get("/invoices");
        setInvoices(res.data.invoices || res.data);
      } catch (err) {
        console.error("Failed to load invoices:", err);
        toast.error("Failed to load invoices");
      }
    };
    loadInvoices();
  }, []);

  // ========================================================================
  // UPDATE AMOUNT WHEN INVOICE SELECTED
  // ========================================================================
  useEffect(() => {
    if (!invoiceId) return;
    const inv = invoices.find((i) => String(i.id) === String(invoiceId));
    setAmount(inv ? inv.balanceAmount ?? inv.balance ?? 0 : "");
  }, [invoiceId, invoices]);

  // ========================================================================
  // HANDLE FILE INPUT
  // ========================================================================
  const handleFile = (e) => setProofFile(e.target.files[0]);

  // ========================================================================
  // SUBMIT PAYMENT REQUEST
  // ========================================================================
  const submit = async (e) => {
    e.preventDefault();

    if (!invoiceId || !amount) return toast.error("Please select invoice & amount");

    const form = new FormData();
    form.append("invoiceId", invoiceId);
    form.append("amount", amount);
    form.append("paymentMode", paymentMode);
    if (utr) form.append("utrNumber", utr);
    if (proofFile) form.append("proofFile", proofFile);

    try {
      setLoading(true);
      await api.post("/payments/request", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Payment request submitted");

      // Reset form
      setInvoiceId("");
      setAmount("");
      setPaymentMode("bank_transfer");
      setUtr("");
      setProofFile(null);
    } catch (err) {
      console.error("Payment request error:", err);
      toast.error(err?.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER FORM
  // ========================================================================
  return (
    <div style={{ maxWidth: 860, margin: "20px auto" }}>
      <h2>Create Payment Request</h2>
      <form onSubmit={submit}>
        {/* Invoice Select */}
        <label>Invoice</label>
        <select
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="">Select invoice</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoiceNumber || inv.number} — Balance: {inv.balanceAmount ?? inv.balance}
            </option>
          ))}
        </select>

        {/* Amount */}
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />

        {/* Payment Mode */}
        <label>Payment Mode</label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </select>

        {/* UTR / Reference */}
        <label>UTR / Reference (optional)</label>
        <input
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />

        {/* Proof File */}
        <label>Proof (optional)</label>
        <input type="file" onChange={handleFile} style={{ width: "100%", marginBottom: 12 }} />
        {proofFile && <div style={{ marginBottom: 12 }}>{proofFile.name}</div>}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => {
              setInvoiceId("");
              setAmount("");
              setPaymentMode("bank_transfer");
              setUtr("");
              setProofFile(null);
            }}
            style={{ padding: "8px 12px" }}
          >
            Reset
          </button>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
