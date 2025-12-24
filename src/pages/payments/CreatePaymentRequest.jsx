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
        const data = res.data;
        const list = Array.isArray(data?.invoices) ? data.invoices : (Array.isArray(data) ? data : []);
        setInvoices(list);
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
  const inputStyle = {
    width: "100%",
    padding: "var(--spacing-3) var(--spacing-4)",
    marginBottom: "var(--spacing-4)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    fontSize: "var(--font-size-sm)",
    fontFamily: "var(--font-family)",
    transition: "all var(--transition-base)",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "var(--spacing-2)",
    color: "var(--color-text-primary)",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)",
  };

  return (
    <div style={{ maxWidth: 860, margin: "var(--spacing-6) auto", padding: "var(--spacing-6)" }}>
      <h2 style={{
        fontSize: "var(--font-size-2xl)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-primary)",
        marginBottom: "var(--spacing-6)"
      }}>Create Payment Request</h2>
      <form onSubmit={submit}>
        {/* Invoice Select */}
        <label style={labelStyle} htmlFor="invoice-select">Invoice</label>
        <select
          id="invoice-select"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
        >
          <option value="">Select invoice</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoiceNumber || inv.number} — Balance: {inv.balanceAmount ?? inv.balance}
            </option>
          ))}
        </select>

        {/* Amount */}
        <label style={labelStyle} htmlFor="amount-input">Amount</label>
        <input
          id="amount-input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
        />

        {/* Payment Mode */}
        <label style={labelStyle} htmlFor="payment-mode-select">Payment Mode</label>
        <select
          id="payment-mode-select"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </select>

        {/* UTR / Reference */}
        <label style={labelStyle} htmlFor="utr-input">UTR / Reference (optional)</label>
        <input
          id="utr-input"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
        />

        {/* Proof File */}
        <label style={labelStyle} htmlFor="proof-file">Proof (optional)</label>
        <input
          id="proof-file"
          type="file"
          onChange={handleFile}
          style={{
            width: "100%",
            marginBottom: "var(--spacing-4)",
            fontSize: "var(--font-size-sm)"
          }}
        />
        {proofFile && (
          <div style={{
            marginBottom: "var(--spacing-4)",
            padding: "var(--spacing-2)",
            background: "var(--color-primary-soft)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-primary)",
            fontSize: "var(--font-size-sm)"
          }}>
            {proofFile.name}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "var(--spacing-3)", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => {
              setInvoiceId("");
              setAmount("");
              setPaymentMode("bank_transfer");
              setUtr("");
              setProofFile(null);
            }}
            style={{
              padding: "var(--spacing-2) var(--spacing-3)",
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              transition: "all var(--transition-base)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary-soft)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-background)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "var(--spacing-2) var(--spacing-3)",
              background: loading ? "var(--color-border)" : "var(--color-primary)",
              color: "var(--color-surface)",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-semibold)",
              transition: "all var(--transition-base)",
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--color-primary-dark)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--color-primary)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
