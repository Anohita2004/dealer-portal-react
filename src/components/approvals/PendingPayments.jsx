import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { Info } from "lucide-react";
import { paymentAPI } from "../../services/api";
import PaymentApprovalCard from "../PaymentApprovalCard";
import { useAuth } from "../../context/AuthContext";

export default function PendingPayments() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = user?.role?.toLowerCase();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            let res;

            if (role === "dealer_admin") {
                res = await paymentAPI.getDealerPending();
            } else {
                // managers and finance roles
                res = await paymentAPI.getFinancePending();
            }

            let list = Array.isArray(res) ? res : res.pending || res.payments || res.data || res || [];

            // Filter by workflow stage for manager roles
            const managerRoles = ["territory_manager", "area_manager", "regional_manager", "regional_admin"];
            if (managerRoles.includes(role)) {
                const filtered = [];
                for (const payment of list) {
                    try {
                        const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
                        const pipeline = ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager", "regional_admin"];
                        const workflow = workflowRes.workflow || workflowRes.data || workflowRes;
                        const currentStage = workflow?.currentStage;

                        // Normalize strings for comparison
                        const normalize = (str) => String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
                        const normRole = normalize(role);
                        const normStage = normalize(currentStage);

                        // Check if current stage matches user role, or if user is at the correct StageX index
                        let isUserTurn = normRole === normStage;
                        if (!isUserTurn && normStage.startsWith("stage")) {
                            const stageNum = parseInt(normStage.replace(/\D/g, ''), 10);
                            const mappedRole = !isNaN(stageNum) && stageNum > 0 ? pipeline[stageNum - 1] : null;
                            isUserTurn = normalize(mappedRole) === normRole;
                        }

                        if ((isUserTurn || normRole === "superadmin") && (workflow?.approvalStatus || "pending").toLowerCase() === "pending") {
                            filtered.push(payment);
                        }
                    } catch (err) {
                        // fallback
                        if ((payment.status || "").toLowerCase() === "pending" || (payment.approvalStatus || "").toLowerCase() === "pending") {
                            filtered.push(payment);
                        }
                    }
                }
                list = filtered;
            } else {
                // general filter for pending
                list = list.filter(p => {
                    const s = (p.status || "").toLowerCase();
                    const as = (p.approvalStatus || "").toLowerCase();
                    return s === "pending" || as === "pending";
                });
            }

            setPayments(list);
        } catch (error) {
            console.error("Failed to fetch pending payments:", error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
        </Box>
    );

    if (payments.length === 0) return (
        <Box sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="info" icon={<Info size={20} />} sx={{ justifyContent: 'center' }}>
                No pending payments for your approval at this stage.
            </Alert>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {payments.map((payment) => (
                <PaymentApprovalCard
                    key={payment.id}
                    payment={payment}
                    onUpdate={fetchPayments}
                    userRole={user?.role}
                />
            ))}
        </Box>
    );
}
