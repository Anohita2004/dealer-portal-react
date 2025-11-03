import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  const [dealers, setDealers] = useState([]);

  const fetchDealers = async () => {
    const res = await api.get("/dealers");
    setDealers(res.data.dealers || res.data);
  };

  const toggleActive = async (id, active) => {
    await api.put(`/dealers/${id}`, { active: !active });
    fetchDealers();
  };

  useEffect(() => { fetchDealers(); }, []);

  return (
    <div>
      <h2>Dealer Management</h2>
      <table border="1" cellPadding="8">
        <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {dealers.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.name}</td>
              <td>{d.active ? "Active" : "Blocked"}</td>
              <td><button onClick={() => toggleActive(d.id, d.active)}>{d.active ? "Block" : "Unblock"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
