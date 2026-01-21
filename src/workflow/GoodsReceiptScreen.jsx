

import React, { useEffect, useState, useContext } from 'react';
import { goodsReceiptAPI, barcodeAPI, orderAPI } from '../services/api';
// WARNING: Do not rely solely on client-side storage for sensitive identifiers like orderId.
// Ensure backend validates user authorization for all order-related actions.

// Example: Use React context or route params to pass orderId securely
// Here, we simulate orderId from props/context for demo purposes


const GoodsReceiptScreen = ({ orderId: propOrderId }) => {
  // You may use context, router params, or props to pass orderId securely
  // For demo, fallback to localStorage ONLY if prop/context is not available
  const orderId = propOrderId || (window?.orderIdContext ?? localStorage.getItem('currentOrderId'));
  const [orderItems, setOrderItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [barcode, setBarcode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [damageReport, setDamageReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchOrderItems = async () => {
      setLoading(true);
      setError('');
      try {
        if (!orderId) {
          setError('No active delivery order found.');
          setLoading(false);
          return;
        }
        const order = await orderAPI.getOrderById(orderId);
        setOrderItems(order.items || []);
        // Initialize quantities
        const initialQty = {};
        (order.items || []).forEach(item => {
          initialQty[item.materialId] = '';
        });
        setQuantities(initialQty);
      } catch (err) {
        setError('Failed to fetch delivery order items.');
      }
      setLoading(false);
    };
    fetchOrderItems();
  }, [orderId]);

  // Handle barcode scan
  const handleBarcodeScan = async () => {
    setError('');
    setSuccess('');
    if (!barcode) return;
    try {
      const result = await barcodeAPI.scan(barcode);
      if (result && result.materialId) {
        setQuantities(qty => ({ ...qty, [result.materialId]: result.qty || '' }));
        setSuccess(`Scanned: ${result.materialName}`);
      } else {
        setError('Barcode not recognized.');
      }
    } catch (err) {
      setError('Barcode scan failed.');
    }
  };

  // Handle quantity change
  const handleQtyChange = (materialId, value) => {
    setQuantities(qty => ({ ...qty, [materialId]: value }));
  };

  // Submit GR
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!orderId) {
        setError('No active delivery order found.');
        setLoading(false);
        return;
      }
      const payload = {
        orderId,
        items: orderItems.map(item => ({
          materialId: item.materialId,
          qty: Number(quantities[item.materialId]) || 0
        })),
        remarks,
        damageReport,
      };
      const result = await goodsReceiptAPI.postReceipt(payload);
      setSuccess('Goods Receipt created successfully!');
      // Optionally, clear form or redirect
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create Goods Receipt.');
    }
    setLoading(false);
  };

  return (
    <div className="gr-creation">
      <h2>Goods Receipt Creation</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Scan Barcode:</label>
          <input
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Enter or scan barcode"
          />
          <button type="button" onClick={handleBarcodeScan} disabled={!barcode || loading}>
            Scan
          </button>
        </div>
        <h3>Delivery Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity Received</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map(item => (
              <tr key={item.materialId}>
                <td>{item.materialName}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={quantities[item.materialId] || ''}
                    onChange={e => handleQtyChange(item.materialId, e.target.value)}
                    placeholder="Enter quantity"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <label>Remarks:</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any remarks..." />
        </div>
        <div>
          <label>Damage Report (optional):</label>
          <textarea value={damageReport} onChange={e => setDamageReport(e.target.value)} placeholder="Report any damages..." />
        </div>
        <button type="submit" disabled={loading}>Create Goods Receipt</button>
      </form>
    </div>
  );
};

export default GoodsReceiptScreen;
