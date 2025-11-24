import React from 'react';

// Very small preview table used by MaterialImport page
export default function ImportPreviewTable({ rows = [], errors = {} }) {
  if (!rows || rows.length === 0) return <div style={{ color: '#666' }}>No preview available</div>;

  const headers = Object.keys(rows[0]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? 'transparent' : '#fafafa' }}>
              {headers.map((h) => (
                <td key={h} style={{ padding: 8, borderBottom: '1px solid #fff' }}>
                  <div>{String(r[h] ?? '')}</div>
                  {errors[i] && errors[i][h] && (
                    <div style={{ color: '#b91c1c', fontSize: 12 }}>{errors[i][h]}</div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
