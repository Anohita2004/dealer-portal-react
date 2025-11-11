import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Campaigns() {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    campaignName: "",
    campaignType: "promotion",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  // Fetch campaigns depending on role
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let res;
      if (isAdmin) {
        res = await api.get("/campaigns"); // admin sees all
      } else {
        res = await api.get("/campaigns/active"); // dealers see only active
      }
      setCampaigns(res.data.campaigns || res.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [isAdmin]);

  // Admin-only: Create Campaign
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/campaigns", form);
      setForm({
        campaignName: "",
        campaignType: "promotion",
        description: "",
        startDate: "",
        endDate: "",
        isActive: true,
      });
      fetchCampaigns();
    } catch (err) {
      console.error("Error creating campaign:", err);
      alert(err.response?.data?.error || "Failed to create campaign");
    }
  };

  // Admin-only: Delete Campaign
  const deleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      alert("Failed to delete campaign");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎯 Campaigns</h2>

      {loading ? (
        <p>Loading campaigns...</p>
      ) : (
        <>
          {/* Admin Form */}
          {isAdmin && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3>Create Campaign</h3>
              <input
                type="text"
                placeholder="Campaign Name"
                value={form.campaignName}
                onChange={(e) =>
                  setForm({ ...form, campaignName: e.target.value })
                }
                required
              />
              <select
                value={form.campaignType}
                onChange={(e) =>
                  setForm({ ...form, campaignType: e.target.value })
                }
              >
                <option value="promotion">Promotion</option>
                <option value="sales_scheme">Sales Scheme</option>
                <option value="seasonal_offer">Seasonal Offer</option>
              </select>

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div style={styles.dateRow}>
                <label>
                  Start:
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  End:
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Active:
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
              </label>

              <button type="submit" style={styles.button}>
                Add Campaign
              </button>
            </form>
          )}

          {/* Campaign List */}
          <div style={styles.list}>
            {campaigns.length === 0 ? (
              <p>No campaigns found.</p>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} style={styles.card}>
                  <h3>{c.campaignName}</h3>
                  <p>
                    <b>Type:</b> {c.campaignType}
                  </p>
                  <p>{c.description}</p>
                  <p>
                    📅 {new Date(c.startDate).toLocaleDateString()} →{" "}
                    {new Date(c.endDate).toLocaleDateString()}
                  </p>
                  <span
                    style={{
                      color: c.isActive ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      style={styles.delete}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "2rem", fontFamily: "Poppins, sans-serif" },
  title: { marginBottom: "1rem", fontWeight: "600", fontSize: "1.4rem" },
  form: {
    display: "grid",
    gap: "0.8rem",
    maxWidth: 500,
    marginBottom: "2rem",
    background: "#fafafa",
    padding: "1rem",
    borderRadius: "8px",
  },
  dateRow: { display: "flex", gap: "1rem", justifyContent: "space-between" },
  button: {
    background: "#1e3c72",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
  },
  list: { display: "grid", gap: "1rem" },
  card: {
    padding: "1rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "#fff",
  },
  delete: {
    marginTop: "0.5rem",
    background: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "6px 10px",
    cursor: "pointer",
  },
};
