import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Search, RefreshCw } from "lucide-react";
import { documentAPI } from "../../services/api";
import DocumentApprovalCard from "../../components/documents/DocumentApprovalCard";
import PageHeader from "../../components/PageHeader";

export default function TerritoryDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentAPI.getDocuments(); // Fetches scoped documents
      const docs = res.documents || res.data || res || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Error fetching territory documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.dealerName?.toLowerCase().includes(searchTerm.toLowerCase());

    const s = (doc.status || "").toLowerCase();
    const as = (doc.approvalStatus || "").toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      s === statusFilter ||
      as === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Territory Documents"
        subtitle="Review and manage documents requiring your attention in this territory"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search documents or dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={fetchDocuments} color="primary">
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredDocuments.length === 0 ? (
        <Card sx={{ py: 8, textAlign: "center" }}>
          <Typography color="text.secondary">No documents found matching your criteria.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredDocuments.map((doc) => (
            <Grid item xs={12} key={doc.id}>
              <DocumentApprovalCard document={doc} onUpdate={fetchDocuments} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
