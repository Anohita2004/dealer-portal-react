import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    regionId: "",
    description: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [regions, setRegions] = useState([]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get("/teams");
      setTeams(res.data.teams || res.data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await api.get("/regions");
      setRegions(res.data.regions || res.data);
    } catch (err) {
      console.error("Failed to fetch regions:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchRegions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, form);
      } else {
        await api.post("/teams", form);
      }
      setModalOpen(false);
      setForm({ name: "", regionId: "", description: "" });
      setEditingTeam(null);
      fetchTeams();
    } catch (err) {
      console.error("Failed to save team:", err);
      alert("Failed to save team");
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      regionId: team.regionId || "",
      description: team.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchTeams();
    } catch (err) {
      console.error("Failed to delete team:", err);
      alert("Failed to delete team");
    }
  };

  const addDealerToTeam = async (teamId, dealerId) => {
    try {
      await api.post(`/teams/${teamId}/dealers`, { dealerId });
      fetchTeams();
    } catch (err) {
      console.error("Failed to add dealer:", err);
    }
  };

  const removeDealerFromTeam = async (teamId, dealerId) => {
    try {
      await api.delete(`/teams/${teamId}/dealers/${dealerId}`);
      fetchTeams();
    } catch (err) {
      console.error("Failed to remove dealer:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
      <button
        onClick={() => setModalOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Team
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <div key={team.id} className="border p-4 rounded">
              <h3 className="font-bold">{team.name}</h3>
              <p>{team.description}</p>
              <p>Region: {team.region?.name || "N/A"}</p>
              <div className="mt-2">
                <h4>Dealers:</h4>
                <ul>
                  {team.dealers?.map((dealer) => (
                    <li key={dealer.id}>
                      {dealer.businessName}
                      <button
                        onClick={() => removeDealerFromTeam(team.id, dealer.id)}
                        className="ml-2 text-red-500"
                      >
                        Remove
                      </button>
                    </li>
                  )) || <li>No dealers</li>}
                </ul>
                {/* Add dealer form */}
                <input
                  type="text"
                  placeholder="Dealer ID"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addDealerToTeam(team.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
              <button onClick={() => handleEdit(team)} className="mr-2 text-blue-500">
                Edit
              </button>
              <button onClick={() => handleDelete(team.id)} className="text-red-500">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded">
            <h2>{editingTeam ? "Edit Team" : "Add Team"}</h2>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
            >
              <option value="">Select Region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Save
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="ml-2"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}