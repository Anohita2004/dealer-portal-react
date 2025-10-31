import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Documents(){
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);

  const fetchDocs = async ()=> {
    const res = await api.get('/documents');
    setFiles(res.data.documents || res.data);
  };

  useEffect(()=>{ fetchDocs(); },[]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Select file');
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', 'other');
    const res = await api.post('/documents', form, { headers: {'Content-Type':'multipart/form-data'}});
    alert('Uploaded');
    setFile(null);
    fetchDocs();
  };

  const download = async (id) => {
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'document';
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div style={{padding:20}}>
      <h2>Documents</h2>
      <form onSubmit={upload}>
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>

      <h3>Files</h3>
      <ul>
        {files.map(f => (
          <li key={f.id}>
            {f.documentName} - <button onClick={()=>download(f.id)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
