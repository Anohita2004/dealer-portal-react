import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    CircularProgress
} from "@mui/material";
import { documentAPI } from "../../services/api";
import DocumentApprovalCard from "../documents/DocumentApprovalCard";

export default function PendingDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            // documentAPI.getManagerDocuments returns documents requiring approval from the current user
            const data = await documentAPI.getManagerDocuments();
            const list = data.data || data.documents || data || [];
            // Filter for pending status if not already filtered by backend
            setDocuments(list.filter(d => {
                const s = (d.status || "").toLowerCase();
                const as = (d.approvalStatus || "").toLowerCase();
                return s === "pending" || as === "pending";
            }));
        } catch (error) {
            console.error("Failed to fetch pending documents:", error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
        </Box>
    );

    if (documents.length === 0) return (
        <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No pending documents for approval.</Typography>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {documents.map((doc) => (
                <DocumentApprovalCard
                    key={doc.id}
                    document={doc}
                    onUpdate={fetchDocuments}
                />
            ))}
        </Box>
    );
}
