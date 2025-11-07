import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";

export default function AccountsInvoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/accounts/invoices");
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error("Failed to load invoices:", err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🧾 All Invoices</h1>
      <Card>
        <DataTable
          columns={[
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "invoiceDate", label: "Date" },
            { key: "totalAmount", label: "Total (₹)" },
            { key: "paidAmount", label: "Paid (₹)" },
            { key: "status", label: "Status" },
          ]}
          rows={invoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            status: inv.status,
          }))}
          emptyMessage="No invoices found"
        />
      </Card>
    </div>
  );
}
