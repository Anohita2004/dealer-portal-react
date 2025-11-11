import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealers");
      setDealers(res.data.dealers || res.data);
    } catch (err) {
      console.error("Error fetching dealers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDealers(); }, []);

  const handleBlockToggle = async (dealer) => {
    const reason = prompt(`Enter reason to ${dealer.isBlocked ? "unblock" : "block"} this dealer:`);
    if (!reason) return;
    try {
      await api.put(`/dealers/${dealer.id}/block`, { isBlocked: !dealer.isBlocked, reason });
      fetchDealers();
    } catch (err) {
      console.error("Error updating dealer status:", err);
      alert("Failed to update dealer block status");
    }
  };

  const handleVerify = async (dealer) => {
    const licenseNumber = prompt("Enter License Number:");
    if (!licenseNumber) return;
    const licenseDocument = prompt("Enter License Document URL (optional):") || null;
    try {
      await api.put(`/dealers/${dealer.id}/verify`, { licenseNumber, licenseDocument });
      fetchDealers();
    } catch (err) {
      console.error("Error verifying dealer:", err);
      alert("Failed to verify dealer");
    }
  };

  if (loading) return <p>Loading dealers...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Dealer Management</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Dealer Code</th>
            <th>Business Name</th>
            <th>Contact Person</th>
            <th>City</th>
            <th>Region</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dealers.map((d) => (
            <tr key={d.id}>
              <td>{d.dealerCode}</td>
              <td>{d.businessName}</td>
              <td>{d.contactPerson || "—"}</td>
              <td>{d.city || "—"}</td>
              <td>{d.region || "—"}</td>
              <td style={{ color: d.isBlocked ? "red" : "green" }}>
                {d.isBlocked ? "Blocked" : "Active"}
              </td>
              <td>{d.isVerified ? "✅" : "❌"}</td>
              <td>
                <button
                  style={{
                    ...styles.button,
                    background: d.isBlocked ? "#2ecc71" : "#e74c3c",
                  }}
                  onClick={() => handleBlockToggle(d)}
                >
                  {d.isBlocked ? "Unblock" : "Block"}
                </button>
                {!d.isVerified && (
                  <button
                    style={{ ...styles.button, background: "#3498db" }}
                    onClick={() => handleVerify(d)}
                  >
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f6fa",
    fontFamily: "'Poppins', sans-serif",
  },
  title: {
    marginBottom: "1rem",
    color: "#2c3e50",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  button: {
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    padding: "6px 12px",
    cursor: "pointer",
    marginRight: "8px",
  },
};
