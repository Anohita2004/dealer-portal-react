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

      // backend returns { fastMoving: [], slowMoving: [] }
      const data = res.data || {};
      setFastMoving(data.fastMoving || []);
      setSlowMoving(data.slowMoving || []);
    } catch (err) {
      console.error('Failed to load analytics', err);
      alert('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderList = (items) =>
    items.map((m) => (
      <li key={m.materialId}>
        {m.material?.materialNumber || m.materialId} — {m.material?.name || 'Unknown'} — {m.totalQty}
      </li>
    ));

  return (
    <div style={{ padding: 20 }}>
      <h2>Materials Analytics</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Start</label>
          <input
            type="date"
            value={range.start}
            onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
          />
        </div>
        <div>
          <label>End</label>
          <input
            type="date"
            value={range.end}
            onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
          />
        </div>
        <div>
          <label>Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <div>
          <button onClick={loadAnalytics} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h4>Fast Moving</h4>
          <ul>{renderList(fastMoving)}</ul>
        </div>

        <div style={{ flex: 1 }}>
          <h4>Slow Moving</h4>
          <ul>{renderList(slowMoving)}</ul>
        </div>
      </div>
    </div>
  );
}
