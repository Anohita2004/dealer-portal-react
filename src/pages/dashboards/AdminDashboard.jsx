import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/reports/summary");
        setSummary(res.data);
      } catch (e) {
        console.error("Error fetching admin summary:", e);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Administrator Dashboard</h2>
      <div className="grid">
        <div className="card" onClick={() => navigate("/campaigns")}>
          <h4>Active Campaigns</h4>
          <p>{summary.activeCampaigns || 0}</p>
        </div>
        <div className="card" onClick={() => navigate("/admin")}>
          <h4>Registered Dealers</h4>
          <p>{summary.dealers || 0}</p>
        </div>
        <div className="card" onClick={() => navigate("/reports")}>
          <h4>Pending Approvals</h4>
          <p>{summary.pendingApprovals || 0}</p>
        </div>
      </div>
    </div>
  );
}
