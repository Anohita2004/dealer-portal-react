import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MaterialAnalytics() {
  const [range, setRange] = useState({ start: '', end: '' });
  const [limit, setLimit] = useState(10);
  const [fastMoving, setFastMoving] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (range.start) params.start = range.start;
      if (range.end) params.end = range.end;
      if (limit) params.limit = limit;

      const res = await api.get('/materials/analytics', { params });
      setFastMoving(res.fastMoving || res.data?.fastMoving || []);
      setSlowMoving(res.slowMoving || res.data?.slowMoving || []);
    } catch (err) {
      console.error('Failed to load analytics', err);
      alert('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // run once on mount
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Materials Analytics</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Start</label>
          <input type="date" value={range.start} onChange={(e) => setRange(r => ({ ...r, start: e.target.value }))} />
        </div>
        <div>
          <label>End</label>
          <input type="date" value={range.end} onChange={(e) => setRange(r => ({ ...r, end: e.target.value }))} />
        </div>
        <div>
          <label>Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <div>
          <button onClick={loadAnalytics} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h4>Fast Moving</h4>
          <ul>
            {fastMoving.map((m) => (
              <li key={m.id}>{m.materialNumber || m.id} — {m.name} — {m.movement || m.count}</li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h4>Slow Moving</h4>
          <ul>
            {slowMoving.map((m) => (
              <li key={m.id}>{m.materialNumber || m.id} — {m.name} — {m.movement || m.count}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
