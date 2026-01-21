
import React, { useEffect, useState } from 'react';
import { invoiceAPI, notificationAPI } from '../services/api';

const InvoiceScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);

  // Fetch invoices for dealer admin
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await invoiceAPI.getInvoices();
        setInvoices(res.invoices || []);
      } catch (err) {
        setError('Failed to fetch invoices.');
      }
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  // Fetch notifications (for demo)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getNotifications({ limit: 10 });
        setNotifications(res.notifications || []);
      } catch {}
    };
    fetchNotifications();
  }, []);

  // Show invoice details
  const handleSelectInvoice = async (invoiceId) => {
    setLoading(true);
    setError('');
    try {
      const invoice = await invoiceAPI.getInvoiceById(invoiceId);
      setSelectedInvoice(invoice);
    } catch (err) {
      setError('Failed to fetch invoice details.');
    }
    setLoading(false);
  };

  // Handle payment request
  const handleMakePayment = () => {
    setShowPaymentForm(true);
    setPaymentMode('');
    setUtrNumber('');
    setProofFile(null);
    setSuccess('');
    setError('');
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('invoiceId', selectedInvoice.id);
      formData.append('amount', selectedInvoice.totalAmount);
      formData.append('paymentMode', paymentMode);
      formData.append('utrNumber', utrNumber);
      if (proofFile) formData.append('proofFile', proofFile);
      // paymentAPI.createRequest expects FormData
      await require('../services/api').paymentAPI.createRequest(formData);
      setSuccess('Payment request submitted successfully!');
      setShowPaymentForm(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit payment request.');
    }
    setLoading(false);
  };

  return (
    <div className="invoice-screen">
      <h2>Invoice Details</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <h3>Notifications</h3>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>{n.title}: {n.message}</li>
        ))}
      </ul>
      <h3>Invoice List</h3>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.status}</td>
              <td>{inv.totalAmount}</td>
              <td>{inv.dueDate}</td>
              <td>
                <button onClick={() => handleSelectInvoice(inv.id)} disabled={loading}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedInvoice && (
        <div className="invoice-detail-modal">
          <h4>Invoice #{selectedInvoice.invoiceNumber}</h4>
          <div>Status: {selectedInvoice.status}</div>
          <div>Amount: {selectedInvoice.totalAmount}</div>
          <div>Due Date: {selectedInvoice.dueDate}</div>
          <div>Order ID: {selectedInvoice.orderId}</div>
          <div>Dealer: {selectedInvoice.dealerName}</div>
          <div>Items:
            <ul>
              {(selectedInvoice.items || []).map(item => (
                <li key={item.materialId}>{item.materialName} - Qty: {item.qty}</li>
              ))}
            </ul>
          </div>
          {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'unpaid' || selectedInvoice.status === 'overdue') && !showPaymentForm && (
            <button onClick={handleMakePayment} disabled={loading}>Make Payment</button>
          )}
          <button onClick={() => setSelectedInvoice(null)}>Close</button>
          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <h5>Initiate Payment</h5>
              <div>
                <label>Payment Mode:</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} required>
                  <option value="">Select</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="CASH">CASH</option>
                </select>
              </div>
              <div>
                <label>UTR/Reference Number:</label>
                <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} required />
              </div>
              <div>
                <label>Upload Proof (optional):</label>
                <input type="file" onChange={e => setProofFile(e.target.files[0])} />
              </div>
              <button type="submit" disabled={loading}>Submit Payment</button>
              <button type="button" onClick={() => setShowPaymentForm(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceScreen;
