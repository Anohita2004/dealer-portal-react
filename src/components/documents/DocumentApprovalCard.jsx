import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    Divider,
    Alert,
    Tooltip,
    IconButton,
    Stack
} from "@mui/material";
import { CheckCircle, XCircle, Clock, AlertCircle, Download, Eye, FileText } from "lucide-react";
import { documentAPI } from "../../services/api";
import { toast } from "react-toastify";
import { useWorkflow } from "../../hooks/useWorkflow";
import ApprovalWorkflow from "../ApprovalWorkflow";
import { useNavigate } from "react-router-dom";

/**
 * Document Approval Card Component
 * Consistent with OrderApprovalCard, showing workflow stages, SLA, and history
 */
export default function DocumentApprovalCard({ document, onUpdate }) {
    const navigate = useNavigate();
    const {
        workflow,
        loading: workflowLoading,
        approve,
        reject,
        refetch: refreshWorkflow
    } = useWorkflow("document", document.id);

    const handleApprove = async () => {
        try {
            await approve();
            if (onUpdate) onUpdate();
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleReject = async (reason) => {
        try {
            await reject(reason);
            if (onUpdate) onUpdate();
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await documentAPI.downloadDocument(document.id);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.href = url;
            a.download = document.fileName || document.name || `document-${document.id}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download document");
        }
    };

    // Calculate SLA urgency
    const getSLAUrgency = () => {
        if (!workflow?.currentSlaExpiresAt) return null;

        const expiresAt = new Date(workflow.currentSlaExpiresAt);
        const now = new Date();
        const diffMs = expiresAt - now;
        const isOverdue = diffMs < 0;
        const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

        return {
            isOverdue,
            isDueSoon: diffMs > 0 && diffMs < 24 * 60 * 60 * 1000,
            diffHours,
            diffMinutes,
            expiresAt,
        };
    };

    const slaUrgency = getSLAUrgency();
    const currentStage = workflow?.currentStage || document.status === "pending" && "territory_manager"; // Fallback

    const formatStageName = (stage) => {
        if (!stage) return "N/A";
        return stage
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split(".").pop().toLowerCase();
        if (ext === "pdf") return <FileText color="#ef4444" />;
        if (["jpg", "jpeg", "png"].includes(ext)) return <FileText color="#3b82f6" />;
        return <FileText color="#9ca3af" />;
    };

    return (
        <Card sx={{ mb: 2, "&:hover": { boxShadow: 4 }, position: "relative", overflow: "visible" }}>
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                bgcolor: "action.hover",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {getFileIcon(document.fileName || document.name)}
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                {document.fileName || document.name || "Untitled Document"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Dealer: <strong>{document.dealer?.businessName || document.dealerName || "N/A"}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Type: {document.documentType || "Other"} • Size: {document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : "N/A"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Uploaded: {new Date(document.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack alignItems="flex-end" spacing={1}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Chip
                                label={workflow?.approvalStatus?.toUpperCase() || document.status?.toUpperCase() || "PENDING"}
                                color={
                                    document.status === "approved" || workflow?.approvalStatus === "approved"
                                        ? "success"
                                        : document.status === "rejected" || workflow?.approvalStatus === "rejected"
                                            ? "error"
                                            : "warning"
                                }
                                size="small"
                                variant="filled"
                            />
                            {currentStage && (
                                <Chip
                                    label={`Stage: ${formatStageName(currentStage)}`}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                />
                            )}

                            {/* Approval Progress */}
                            {workflow && (() => {
                                const { pipeline = [], completedStages = [], approvalStatus } = workflow;
                                if (pipeline.length === 0) return null;

                                const isApproved = approvalStatus === "approved";
                                const completedCount = (completedStages?.length || 0) + (isApproved ? 1 : 0);
                                const progress = Math.round((completedCount / pipeline.length) * 100);

                                if (progress > 0 && progress < 100) {
                                    return (
                                        <Box sx={{ width: "100%", mt: 0.5 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Progress
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {progress}%
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    height: 4,
                                                    bgcolor: "grey.200",
                                                    borderRadius: 1,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: `${progress}%`,
                                                        height: "100%",
                                                        bgcolor: "primary.main",
                                                        transition: "width 0.3s ease",
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    );
                                }
                                return null;
                            })()}
                        </Box>

                        {slaUrgency && (workflow?.approvalStatus === "pending" || document.status === "pending") && (
                            <Chip
                                icon={slaUrgency.isOverdue ? <AlertCircle size={14} /> : <Clock size={14} />}
                                label={
                                    slaUrgency.isOverdue
                                        ? `Overdue: ${slaUrgency.diffHours}h ${slaUrgency.diffMinutes}m`
                                        : `Due in: ${slaUrgency.diffHours}h ${slaUrgency.diffMinutes}m`
                                }
                                color={slaUrgency.isOverdue ? "error" : slaUrgency.isDueSoon ? "warning" : "info"}
                                size="small"
                                variant="outlined"
                            />
                        )}

                        <Box>
                            <Tooltip title="View Details">
                                <IconButton size="small" color="primary" onClick={() => navigate(`/documents/${document.id}`)}>
                                    <Eye size={18} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                                <IconButton size="small" onClick={handleDownload}>
                                    <Download size={18} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Stack>
                </Box>

                {slaUrgency?.isOverdue && (workflow?.approvalStatus === "pending" || document.status === "pending") && (
                    <Alert severity="error" sx={{ mb: 2, py: 0 }}>
                        SLA Overdue: This document requires immediate attention.
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                <ApprovalWorkflow
                    entity={{ type: "document", ...document }}
                    currentStage={currentStage}
                    approvalStatus={workflow?.approvalStatus || document.status}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    approvalHistory={workflow?.timeline || document.history || []}
                    showHistory={true}
                />

                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate(`/documents/${document.id}`)}
                    >
                        View Full History & Timeline
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
