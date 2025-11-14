import React, { useEffect, useState } from "react";
import api from "../services/api";

import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Search,
} from "lucide-react";

export default function Documents() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchDocs = async () => {
    const res = await api.get("/documents");
    setFiles(res.data.documents || res.data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileSelection = (e) => {
    const list = Array.from(e.target.files);
    setSelectedFiles(list);
    setPreview(list.length === 1 ? URL.createObjectURL(list[0]) : null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const dropped = Array.from(e.dataTransfer.files);
    setSelectedFiles(dropped);
    setPreview(dropped.length === 1 ? URL.createObjectURL(dropped[0]) : null);
  };

  const upload = async () => {
    if (!selectedFiles.length) return;

    const newProgress = {};

    const uploads = selectedFiles.map(async (file) => {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", "other");

      return api.post("/documents", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) => {
          newProgress[file.name] = Math.round((p.loaded * 100) / p.total);
          setProgress({ ...newProgress });
        },
      });
    });

    await Promise.all(uploads);

    setSelectedFiles([]);
    setPreview(null);
    setProgress({});
    fetchDocs();
  };

  const download = async (id, name) => {
    const res = await api.get(`/documents/${id}/download`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this document?")) return;

    await api.delete(`/documents/${id}`);
    fetchDocs();
  };

  const iconFor = (name) => {
    const ext = name.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(ext))
      return <ImageIcon size={28} />;

    if (ext === "pdf") return <FileText size={28} />;

    return <File size={28} />;
  };

  const filtered = files.filter((f) => {
    const matchesSearch = f.documentName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "all" || f.documentType === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: "2rem", color: "var(--text-color)" }}>
      <h1
        style={{ marginBottom: "1rem", fontSize: "1.8rem", fontWeight: 600 }}
      >
        Documents
      </h1>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              top: 12,
              left: 10,
              opacity: 0.5,
            }}
          />

          <input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.7rem 2.5rem",
              borderRadius: 10,
            }}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "0.7rem", borderRadius: 10 }}
        >
          <option value="all">All</option>
          <option value="invoice">Invoices</option>
          <option value="document">Documents</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: dragOver
            ? "2px dashed #f97316"
            : "2px dashed var(--card-border)",
          padding: "2rem",
          borderRadius: 15,
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <Upload size={40} style={{ opacity: 0.7 }} />
        <p>Drag & Drop files here or click to select</p>

        <input
          id="fileInput"
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelection}
        />

        <button onClick={() => document.getElementById("fileInput").click()}>
          Choose Files
        </button>
      </div>

      {/* Preview + Upload */}
      {selectedFiles.length > 0 && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            borderRadius: 10,
            background: "var(--card-bg)",
          }}
        >
          <h3>Selected Files</h3>

          {preview && (
            <img
              src={preview}
              alt="preview"
              style={{
                maxHeight: 120,
                borderRadius: 8,
                marginBottom: "1rem",
              }}
            />
          )}

          {selectedFiles.map((f) => (
            <div key={f.name} style={{ marginBottom: "0.5rem" }}>
              {f.name}

              {progress[f.name] && (
                <div
                  style={{
                    height: 6,
                    background: "#333",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: `${progress[f.name]}%`,
                      height: "100%",
                      background: "#f97316",
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          <button onClick={upload} style={{ marginTop: "1rem" }}>
            Upload All
          </button>
        </div>
      )}

      {/* Files Grid */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        }}
      >
        {filtered.map((f) => (
          <div
            key={f.id}
            style={{
              padding: "1.2rem",
              borderRadius: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>{iconFor(f.documentName)}</div>

            <h4 style={{ marginBottom: "0.5rem" }}>{f.documentName}</h4>
            <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
              {f.documentType}
            </p>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={() => download(f.id, f.documentName)}>
                <Download size={18} />
              </button>

              <button onClick={() => remove(f.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
