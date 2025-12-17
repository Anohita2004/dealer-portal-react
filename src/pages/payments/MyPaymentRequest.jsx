// src/pages/payments/MyPaymentRequests.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Tooltip,
  Alert,
  LinearProgress,
} from "@mui/material";
import { paymentAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { getPaymentStatusDisplay, getPaymentPendingReason, getApprovalProgress } from "../../utils/paymentStatus";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye } from "lucide-react";

export default function MyPaymentRequests() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getMyRequests();
      const paymentsList = res.payments || res.data || res || [];
      setPayments(Array.isArray(paymentsList) ? paymentsList : []);

      // Load workflow data for each payment
      const workflowPromises = paymentsList
        .filter((p) => p.id)
        .map(async (payment) => {
          try {
            const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
            return {
              paymentId: payment.id,
              workflow: workflowRes.workflow || workflowRes.data || workflowRes,
            };
          } catch (err) {
            return { paymentId: payment.id, workflow: null };
          }
        });

      const workflowResults = await Promise.all(workflowPromises);
      const workflowMap = {};
      workflowResults.forEach(({ paymentId, workflow }) => {
        if (workflow) workflowMap[paymentId] = workflow;
      });
      setWorkflows(workflowMap);
    } catch (e) {
      console.error("Failed to load payments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadProof = (payment) => {
    if (payment.proofUrl || payment.proofFile) {
      window.open(payment.proofUrl || payment.proofFile, "_blank");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="My Payment Requests"
        subtitle="Track your payment request status and approval progress"
      />

      {loading ? (
        <Typography>Loading payments...</Typography>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No payment requests yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {payments.map((payment) => {
            const workflow = workflows[payment.id];
            const statusDisplay = getPaymentStatusDisplay(payment, workflow);
            const pendingReason = getPaymentPendingReason(payment, workflow);
            const approvalProgress = getApprovalProgress(workflow);

            return (
              <Card key={payment.id} sx={{ "&:hover": { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Payment Request #{payment.id?.slice(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Invoice: {payment.invoiceNumber || payment.invoice?.invoiceNumber || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: ₹{Number(payment.amount || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                      <Tooltip title={statusDisplay.description}>
                        <Chip
                          label={statusDisplay.label}
                          color={statusDisplay.color}
                          size="small"
                          icon={
                            statusDisplay.icon === "success" ? (
                              <CheckCircle size={14} />
                            ) : statusDisplay.icon === "error" ? (
                              <XCircle size={14} />
                            ) : (
                              <Clock size={14} />
                            )
                          }
                        />
                      </Tooltip>
                      {workflow?.currentStage && (
                        <Chip
                          label={`Stage: ${workflow.currentStage.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`}
                          variant="outlined"
                          size="small"
                          color="primary"
                        />
                      )}
                      {approvalProgress > 0 && approvalProgress < 100 && (
                        <Box sx={{ width: 150, mt: 0.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {approvalProgress}%
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={approvalProgress} sx={{ height: 4, borderRadius: 1 }} />
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Why Payment is Pending - Backend Intelligence */}
                  {pendingReason && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {pendingReason.reason}
                      </Typography>
                      <Typography variant="caption">
                        {pendingReason.nextAction}
                      </Typography>
                    </Alert>
                  )}

                  {/* Proof Document */}
                  {payment.proofFile || payment.proofUrl ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Chip label="Proof Uploaded" color="success" size="small" />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={16} />}
                        onClick={() => downloadProof(payment)}
                      >
                        View Proof
                      </Button>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Proof document is required for approval
                    </Alert>
                  )}

                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/payments/${payment.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
