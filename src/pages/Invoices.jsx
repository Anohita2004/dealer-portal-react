import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Invoices(){
  const [invoices, setInvoices] = useState([]);
  useEffect(()=>{
    (async ()=>{
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices || res.data);
    })();
  },[]);

  const downloadPdf = async (id, invoiceNumber) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a); a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF');
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>Invoices</h2>
      <table border="1" cellPadding="8">
        <thead><tr><th>#</th><th>Invoice No</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {invoices.map(i => (
            <tr key={i.id}>
              <td>{i.invoiceNumber}</td>
              <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
              <td>₹{i.totalAmount}</td>
              <td>{i.status}</td>
              <td><button onClick={()=>downloadPdf(i.id, i.invoiceNumber)}>Download PDF</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
