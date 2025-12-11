import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState({ open: false, team: null });
  const [assignManagerModal, setAssignManagerModal] = useState({ open: false, teamId: null });
  const [addDealerModal, setAddDealerModal] = useState({ open: false, teamId: null });
  const [removeDealerModal, setRemoveDealerModal] = useState({ open: false, teamId: null });
  const [form, setForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [assignForm, setAssignForm] = useState({ managerId: "" });
  const [dealerForm, setDealerForm] = useState({ dealerId: "" });
  const [removeDealerForm, setRemoveDealerForm] = useState({ dealerId: "" });

  const fetchTeams = async () => {
    try {
      const res = await api.get("/team");
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post("/team", form);
      setCreateModalOpen(false);
      setForm({ name: "", description: "" });
      fetchTeams();
    } catch (err) {
      console.error("Failed to create team:", err);
      alert("Failed to create team");
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/team/${editModalOpen.team.id}`, editForm);
      setEditModalOpen({ open: false, team: null });
      setEditForm({ name: "", description: "" });
      fetchTeams();
    } catch (err) {
      console.error("Failed to edit team:", err);
      alert("Failed to edit team");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.delete(`/team/${teamId}`);
      fetchTeams();
    } catch (err) {
      console.error("Failed to delete team:", err);
      alert("Failed to delete team");
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      await api.post("/team/assign-manager", { teamId: assignManagerModal.teamId, ...assignForm });
      setAssignManagerModal({ open: false, teamId: null });
      setAssignForm({ managerId: "" });
      fetchTeams();
    } catch (err) {
      console.error("Failed to assign manager:", err);
      alert("Failed to assign manager");
    }
  };

  const handleRemoveManager = async (teamId) => {
    if (!window.confirm("Are you sure you want to remove the manager from this team?")) return;
    try {
      await api.delete(`/team/remove-manager/${teamId}`);
      fetchTeams();
    } catch (err) {
      console.error("Failed to remove manager:", err);
      alert("Failed to remove manager");
    }
  };

  const handleAddDealer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/team/add-dealer/${addDealerModal.teamId}`, dealerForm);
      setAddDealerModal({ open: false, teamId: null });
      setDealerForm({ dealerId: "" });
      fetchTeams();
    } catch (err) {
      console.error("Failed to add dealer:", err);
      alert("Failed to add dealer");
    }
  };

  const handleRemoveDealer = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/team/remove-dealer/${removeDealerModal.teamId}/${removeDealerForm.dealerId}`);
      setRemoveDealerModal({ open: false, teamId: null });
      setRemoveDealerForm({ dealerId: "" });
      fetchTeams();
    } catch (err) {
      console.error("Failed to remove dealer:", err);
      alert("Failed to remove dealer");
    }
  };

  if (loading) return <p>Loading teams...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Team Management</h1>
      <button
        onClick={() => setCreateModalOpen(true)}
        style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px", marginBottom: "1rem" }}
      >
        Create Team
      </button>

      <div style={{ display: "grid", gap: "1rem" }}>
        {teams.map((team) => (
          <div key={team.id} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
            <h3>{team.name}</h3>
            <p>Manager: {team.managers?.[0]?.username || "None"}</p>
            <p>Dealer Admins / Staff Count: {team.dealers?.length || 0}</p>
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => { setEditForm({ name: team.name, description: team.description || "" }); setEditModalOpen({ open: true, team }); }}
                style={{ padding: "0.3rem 0.6rem", background: "#fbbf24", color: "white", border: "none", borderRadius: "4px", marginRight: "0.5rem" }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTeam(team.id)}
                style={{ padding: "0.3rem 0.6rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", marginRight: "0.5rem" }}
              >
                Delete
              </button>
              {team.managers?.[0] && (
                <button
                  onClick={() => handleRemoveManager(team.id)}
                  style={{ padding: "0.3rem 0.6rem", background: "#f59e0b", color: "white", border: "none", borderRadius: "4px", marginRight: "0.5rem" }}
                >
                  Remove Manager
                </button>
              )}
              <button
                onClick={() => setAssignManagerModal({ open: true, teamId: team.id })}
                style={{ padding: "0.3rem 0.6rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", marginRight: "0.5rem" }}
              >
                Add Manager
              </button>
              <button
                onClick={() => setAddDealerModal({ open: true, teamId: team.id })}
                style={{ padding: "0.3rem 0.6rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", marginRight: "0.5rem" }}
              >
                Add Dealer
              </button>
              {team.dealers?.length > 0 && (
                <button
                  onClick={() => setRemoveDealerModal({ open: true, teamId: team.id })}
                  style={{ padding: "0.3rem 0.6rem", background: "#dc2626", color: "white", border: "none", borderRadius: "4px" }}
                >
                  Remove Dealer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {createModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form onSubmit={handleCreateTeam} style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px" }}>
            <h2>Create Team</h2>
            <input
              placeholder="Team Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
              Create
            </button>
            <button type="button" onClick={() => setCreateModalOpen(false)} style={{ marginLeft: "1rem", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Edit Team Modal */}
      {editModalOpen.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form onSubmit={handleEditTeam} style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px" }}>
            <h2>Edit Team</h2>
            <input
              placeholder="Team Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <textarea
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
              Update
            </button>
            <button type="button" onClick={() => setEditModalOpen({ open: false, team: null })} style={{ marginLeft: "1rem", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Assign Manager Modal */}
      {assignManagerModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form onSubmit={handleAssignManager} style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px" }}>
            <h2>Assign Sales Manager</h2>
            <input
              placeholder="Manager ID"
              value={assignForm.managerId}
              onChange={(e) => setAssignForm({ managerId: e.target.value })}
              required
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
              Assign
            </button>
            <button type="button" onClick={() => setAssignManagerModal({ open: false, teamId: null })} style={{ marginLeft: "1rem", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Add Dealer Modal */}
      {addDealerModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form onSubmit={handleAddDealer} style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px" }}>
            <h2>Add Dealer Admin/Staff</h2>
            <input
              placeholder="Dealer ID"
              value={dealerForm.dealerId}
              onChange={(e) => setDealerForm({ dealerId: e.target.value })}
              required
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
              Add
            </button>
            <button type="button" onClick={() => setAddDealerModal({ open: false, teamId: null })} style={{ marginLeft: "1rem", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Remove Dealer Modal */}
      {removeDealerModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form onSubmit={handleRemoveDealer} style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px" }}>
            <h2>Remove Dealer Admin/Staff</h2>
            <input
              placeholder="Dealer ID"
              value={removeDealerForm.dealerId}
              onChange={(e) => setRemoveDealerForm({ dealerId: e.target.value })}
              required
              style={{ display: "block", marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
              Remove
            </button>
            <button type="button" onClick={() => setRemoveDealerModal({ open: false, teamId: null })} style={{ marginLeft: "1rem", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}