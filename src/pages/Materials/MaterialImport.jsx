import React, { useState } from 'react';
import api from '../../services/api';
import ImportPreviewTable from '../../components/ImportPreviewTable';

export default function MaterialImport() {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewErrors, setPreviewErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

const downloadTemplate = async () => {
  try {
    const res = await api.get('/materials/template', {
      responseType: 'blob' // important for files
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'material_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
    alert('Failed to download template');
  }
};


  const onFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setPreviewRows([]);
    setPreviewErrors({});
    setResult(null);
  };

  const previewOnServer = async () => {
    if (!file) return alert('Select a file first');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/materials/import/validate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewRows(res.data.preview || []);
      setPreviewErrors(res.data.errors || {});
    } catch (err) {
      console.error(err);
      alert('Failed to validate file on server');
    } finally {
      setLoading(false);
    }
  };

  const importToServer = async () => {
    if (!file) return alert('Select a file first');
    if (!confirm('Proceed with importing the selected file?')) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/materials/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setPreviewRows(res.data.preview || []);
      setPreviewErrors(res.data.errors || {});
      alert('Import completed');
    } catch (err) {
      console.error(err);
      alert('Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Import Materials</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={downloadTemplate} style={{ marginRight: 8 }}>Download template</button>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={previewOnServer} disabled={!file || loading} style={{ marginRight: 8 }}>Preview</button>
        <button onClick={importToServer} disabled={!file || loading}>Import</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Preview</h4>
        <ImportPreviewTable rows={previewRows} errors={previewErrors} />
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <h4>Result</h4>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f4f6', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
