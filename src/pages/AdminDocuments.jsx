import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

 const handleReview = async (docId, action) => {
  const remarks = prompt(`Add remarks for ${action}:`) || "";
  await api.patch(`/documents/${docId}/status`, { action, remarks }); // matches router.patch('/:id/status')
  fetchDocuments();
};

  if (loading) return <p>Loading documents...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Document Review</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Dealer</th>
            <th>Document Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Uploaded At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.dealer?.businessName || "—"}</td>
              <td>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.name}
                </a>
              </td>
              <td>{doc.type}</td>
              <td
                style={{
                  color: doc.status === "approved" ? "green" : doc.status === "rejected" ? "red" : "orange",
                }}
              >
                {doc.status || "pending"}
              </td>
              <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td>
                {doc.status === "pending" && (
                  <>
                    <button
                      style={{ ...styles.button, background: "#2ecc71" }}
                      onClick={() => handleReview(doc.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      style={{ ...styles.button, background: "#e74c3c" }}
                      onClick={() => handleReview(doc.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
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
  container: { padding: "2rem", fontFamily: "'Poppins', sans-serif" },
  title: { marginBottom: "1rem", color: "#2c3e50" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  button: {
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    padding: "6px 10px",
    cursor: "pointer",
    marginRight: "5px",
  },
};
