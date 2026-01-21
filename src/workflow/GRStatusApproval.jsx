
import React, { useEffect, useState } from 'react';
import { goodsReceiptAPI, workflowAPI, notificationAPI } from '../services/api';

const GRStatusApproval = () => {
  const [pendingGRs, setPendingGRs] = useState([]);
  const [selectedGR, setSelectedGR] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Fetch GRs awaiting approval
  useEffect(() => {
    const fetchPendingGRs = async () => {
      setError('');
      try {
        const grs = await goodsReceiptAPI.getPending();
        setPendingGRs(grs || []);
      } catch (err) {
        setError('Failed to fetch pending GRs.');
      }
    };
    fetchPendingGRs();
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

  // Approve or reject GR
  const handleAction = async (grId, action) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = { action, reason: action === 'reject' ? remarks : undefined };
      await workflowAPI.approveEntity('goods-receipt', grId, remarks);
      setSuccess(`GR ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setSelectedGR(null);
      setRemarks('');
      // Refresh list
      const grs = await goodsReceiptAPI.getPending();
      setPendingGRs(grs || []);
    } catch (err) {
      setError('Failed to update GR status.');
    }
    setActionLoading(false);
  };

  return (
    <div className="gr-status-approval">
      <h2>GR Status & Approval</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <h3>Notifications</h3>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>{n.title}: {n.message}</li>
        ))}
      </ul>
      <h3>Pending Goods Receipts</h3>
      <table>
        <thead>
          <tr>
            <th>GR ID</th>
            <th>Status</th>
            <th>Dealer</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingGRs.map(gr => (
            <tr key={gr.id}>
              <td>{gr.id}</td>
              <td>{gr.status}</td>
              <td>{gr.dealerName}</td>
              <td>
                <ul>
                  {(gr.items || []).map(item => (
                    <li key={item.materialId}>{item.materialName} - Qty: {item.qty}</li>
                  ))}
                </ul>
              </td>
              <td>
                <button onClick={() => setSelectedGR(gr)} disabled={actionLoading}>Approve/Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedGR && (
        <div className="gr-action-modal">
          <h4>Approve/Reject GR #{selectedGR.id}</h4>
          <div>Status: {selectedGR.status}</div>
          <div>Dealer: {selectedGR.dealerName}</div>
          <div>Items:
            <ul>
              {(selectedGR.items || []).map(item => (
                <li key={item.materialId}>{item.materialName} - Qty: {item.qty}</li>
              ))}
            </ul>
          </div>
          <div>
            <label>Remarks (optional for rejection):</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
          <button onClick={() => handleAction(selectedGR.id, 'approve')} disabled={actionLoading}>Approve</button>
          <button onClick={() => handleAction(selectedGR.id, 'reject')} disabled={actionLoading}>Reject</button>
          <button onClick={() => { setSelectedGR(null); setRemarks(''); }}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default GRStatusApproval;
