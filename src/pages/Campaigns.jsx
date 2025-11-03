import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ title: "", description: "", active: true });

  const fetchCampaigns = async () => {
    const res = await api.get("/campaigns");
    setCampaigns(res.data.campaigns || res.data);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const addCampaign = async (e) => {
    e.preventDefault();
    await api.post("/campaigns", newCampaign);
    setNewCampaign({ title: "", description: "", active: true });
    fetchCampaigns();
  };

  return (
    <div>
      <h2>Campaigns</h2>
      <form onSubmit={addCampaign}>
        <input placeholder="Title" value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}/>
        <input placeholder="Description" value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})}/>
        <label>
          Active: 
          <input type="checkbox" checked={newCampaign.active} onChange={e => setNewCampaign({...newCampaign, active: e.target.checked})}/>
        </label>
        <button type="submit">Add</button>
      </form>

      <ul>
        {campaigns.map(c => (
          <li key={c.id}>{c.title} — {c.active ? "Active" : "Inactive"}</li>
        ))}
      </ul>
    </div>
  );
}
