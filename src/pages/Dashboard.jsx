import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard(){
  const [report, setReport] = useState(null);
  useEffect(()=>{
    (async ()=>{
      try {
        const res = await api.get('/reports/dealer-performance');
        setReport(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  },[]);
  return (
    <div style={{padding:20}}>
      <h2>Dashboard</h2>
      {report ? (
        <div>
          <p>Total invoices: {report.totalInvoices}</p>
          <p>Total sales: {report.totalSales}</p>
        </div>
      ) : <p>Loading...</p>}
    </div>
  );
}
