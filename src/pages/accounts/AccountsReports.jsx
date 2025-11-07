import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function AccountsReports() {
  const [report, setReport] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/accounts/dealer-reports");
        setReport(res.data.dealers || []);
      } catch (err) {
        console.error("Failed to load dealer reports:", err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📊 Dealer Financial Reports</h1>
      <Card>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={report}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dealer" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
            <Bar dataKey="paid" fill="#22c55e" name="Paid" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
