import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MaterialAlerts() {
  const [alerts, setAlerts] = useState({ reorderAlerts: [], expiryAlerts: [] });
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/alerts', { params: { days: 30 } });
      setAlerts({ reorderAlerts: res.data.reorderAlerts || [], expiryAlerts: res.data.expiryAlerts || [] });
    } catch (err) {
      console.error('Failed to fetch alerts', err);
      alert('Failed to fetch material alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const acknowledge = async (type, id) => {
    try {
      await api.post(`/materials/alerts/${id}/acknowledge`, { type });
      loadAlerts();
    } catch (err) {
      console.error('Ack failed', err);
      alert('Failed to acknowledge');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Material Alerts</h2>

      <section style={{ marginTop: 12 }}>
        <h4>Reorder Alerts</h4>
        {alerts.reorderAlerts.length === 0 && <div>No reorder alerts</div>}
        <ul>
          {alerts.reorderAlerts.map((a) => (
            <li key={a.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{a.materialNumber}</strong> — {a.name} — stock: {a.stock}
              </div>
              <div>
                <button onClick={() => acknowledge('reorder', a.id)}>Acknowledge</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 12 }}>
        <h4>Expiry Alerts</h4>
        {alerts.expiryAlerts.length === 0 && <div>No expiry alerts</div>}
        <ul>
          {alerts.expiryAlerts.map((a) => (
            <li key={a.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{a.materialNumber}</strong> — {a.name} — expires: {a.expiryDate}
              </div>
              <div>
                <button onClick={() => acknowledge('expiry', a.id)}>Acknowledge</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
