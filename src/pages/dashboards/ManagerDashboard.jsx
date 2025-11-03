import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function ManagerDashboard() {
  const [dealers, setDealers] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/reports/dealer-performance");
        setDealers(res.data.dealers || []);
        setSummary({
          totalDealers: res.data.dealers?.length || 0,
          avgSales: res.data.averageSales || 0
        });
      } catch (err) {
        console.error("Error fetching TM dashboard:", err);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Territory / Area Manager Dashboard</h2>
      <div className="grid">
        <div className="card"><h4>Total Dealers</h4><p>{summary.totalDealers}</p></div>
        <div className="card"><h4>Average Sales</h4><p>₹{summary.avgSales}</p></div>
      </div>
      <h3>Dealer Performance</h3>
      <table border="1" cellPadding="8">
        <thead><tr><th>Name</th><th>Region</th><th>Sales</th><th>License Validity</th></tr></thead>
        <tbody>
          {dealers.map(d => (
            <tr key={d.id}><td>{d.name}</td><td>{d.region}</td><td>₹{d.sales}</td><td>{d.licenseValidity}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
