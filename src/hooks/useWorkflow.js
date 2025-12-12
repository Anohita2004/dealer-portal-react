import { useState, useEffect, useCallback } from "react";
import { workflowAPI, orderAPI, invoiceAPI, paymentAPI, pricingAPI, documentAPI, campaignAPI } from "../services/api";
import { getSocket } from "../services/socket";
import { toast } from "react-toastify";

/**
 * useWorkflow Hook
 * Manages workflow state, fetching, and real-time updates
 */
export function useWorkflow(entityType, entityId) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the appropriate API method based on entity type
  const getWorkflowAPI = useCallback(() => {
    const apis = {
      order: orderAPI,
      invoice: invoiceAPI,
      payment: paymentAPI,
      pricing: pricingAPI,
      document: documentAPI,
      campaign: campaignAPI,
    };
    return apis[entityType] || workflowAPI;
  }, [entityType]);

  // Fetch workflow status
  const fetchWorkflow = useCallback(async () => {
    if (!entityId) return;

    setLoading(true);
    setError(null);

    try {
      const api = getWorkflowAPI();
      const response = await api.getWorkflowStatus(entityId);
      
      // Handle different response formats
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (err) {
      console.error("Error fetching workflow:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch workflow status");
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, [entityId, getWorkflowAPI]);

  // Approve entity
  const approve = useCallback(
    async (remarks = "") => {
      if (!entityId) return;

      setLoading(true);
      setError(null);

      try {
        const api = getWorkflowAPI();
        let response;

        // Use entity-specific approve methods
        if (entityType === "order") {
          response = await orderAPI.approveOrder(entityId, { remarks });
        } else if (entityType === "invoice") {
          response = await invoiceAPI.approveInvoice(entityId, { remarks });
        } else if (entityType === "payment") {
          response = await paymentAPI.approveByFinance(entityId, { remarks });
        } else if (entityType === "pricing") {
          response = await pricingAPI.approve(entityId, { remarks });
        } else if (entityType === "document") {
          response = await documentAPI.approveRejectDocument(entityId, { action: "approve", remarks });
        } else if (entityType === "campaign") {
          // Campaign approval might need different endpoint
          response = await workflowAPI.approveEntity(entityType, entityId, remarks);
        } else {
          response = await workflowAPI.approveEntity(entityType, entityId, remarks);
        }

        toast.success(response.message || "Entity approved successfully");
        
        // Refresh workflow status
        await fetchWorkflow();
        
        return response;
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || "Failed to approve";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [entityId, entityType, getWorkflowAPI, fetchWorkflow]
  );

  // Reject entity
  const reject = useCallback(
    async (reason, remarks = "") => {
      if (!entityId) return;

      if (!reason || !reason.trim()) {
        const errorMsg = "Rejection reason is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const api = getWorkflowAPI();
        let response;

        // Use entity-specific reject methods
        if (entityType === "order") {
          response = await orderAPI.rejectOrder(entityId, { reason, remarks });
        } else if (entityType === "invoice") {
          response = await invoiceAPI.approveInvoice(entityId, { action: "reject", reason, remarks });
        } else if (entityType === "payment") {
          response = await paymentAPI.rejectByFinance(entityId, { reason, remarks });
        } else if (entityType === "pricing") {
          response = await pricingAPI.reject(entityId, { reason, remarks });
        } else if (entityType === "document") {
          response = await documentAPI.approveRejectDocument(entityId, { action: "reject", reason, remarks });
        } else if (entityType === "campaign") {
          response = await workflowAPI.rejectEntity(entityType, entityId, reason, remarks);
        } else {
          response = await workflowAPI.rejectEntity(entityType, entityId, reason, remarks);
        }

        toast.success(response.message || "Entity rejected");
        
        // Refresh workflow status
        await fetchWorkflow();
        
        return response;
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || "Failed to reject";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [entityId, entityType, getWorkflowAPI, fetchWorkflow]
  );

  // Set up real-time updates via Socket.IO
  useEffect(() => {
    if (!entityId || !entityType) return;

    const socket = getSocket();
    if (!socket || !socket.connected) return;

    // Listen for workflow events
    const handleStageTransition = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        fetchWorkflow();
        toast.info(`Workflow moved to stage: ${data.stage}`);
      }
    };

    const handleApproved = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        fetchWorkflow();
        toast.success("Entity fully approved!");
      }
    };

    const handleRejected = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        fetchWorkflow();
        toast.error("Entity rejected");
      }
    };

    socket.on("workflow:stage_transition", handleStageTransition);
    socket.on("workflow:approved", handleApproved);
    socket.on("workflow:rejected", handleRejected);

    return () => {
      socket.off("workflow:stage_transition", handleStageTransition);
      socket.off("workflow:approved", handleApproved);
      socket.off("workflow:rejected", handleRejected);
    };
  }, [entityId, entityType, fetchWorkflow]);

  // Initial fetch
  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!entityId) return;

    const interval = setInterval(() => {
      fetchWorkflow();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [entityId, fetchWorkflow]);

  return {
    workflow,
    loading,
    error,
    approve,
    reject,
    refetch: fetchWorkflow,
  };
}

