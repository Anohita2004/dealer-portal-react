import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";

export default function AccountsNotes() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/accounts/notes");
        setNotes(res.data.notes || []);
      } catch (err) {
        console.error("Failed to load credit/debit notes:", err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>💼 Credit & Debit Notes</h1>
      <Card>
        <DataTable
          columns={[
            { key: "noteNumber", label: "Note #" },
            { key: "noteType", label: "Type" },
            { key: "noteDate", label: "Date" },
            { key: "amount", label: "Amount (₹)" },
            { key: "status", label: "Status" },
          ]}
          rows={notes.map((n) => ({
            id: n.id,
            noteNumber: n.noteNumber,
            noteType: n.noteType,
            noteDate: new Date(n.noteDate).toLocaleDateString(),
            amount: n.amount,
            status: n.status,
          }))}
          emptyMessage="No credit/debit notes available"
        />
      </Card>
    </div>
  );
}
