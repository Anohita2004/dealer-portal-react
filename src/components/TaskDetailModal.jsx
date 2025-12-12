import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Clock, AlertCircle, CheckCircle, FileText, DollarSign, ShoppingCart, Tag, Receipt } from "lucide-react";

/**
 * TaskDetailModal - Shows detailed information about a task
 * Includes overdue indicators, SLA information, and quick actions
 */
export default function TaskDetailModal({ task, onClose, onAction }) {
  const navigate = useNavigate();

  if (!task) return null;

  const getTaskIcon = (type) => {
    const icons = {
      order: ShoppingCart,
      invoice: Receipt,
      payment: DollarSign,
      document: FileText,
      pricing: Tag,
    };
    return icons[type] || FileText;
  };

  const getTaskRoute = (task) => {
    const routes = {
      order: `/orders/approvals?id=${task.entityId}`,
      invoice: `/invoices?id=${task.entityId}`,
      payment: `/payments/finance/pending?id=${task.entityId}`,
      document: `/documents?id=${task.entityId}`,
      pricing: `/pricing?id=${task.entityId}`,
    };
    return routes[task.type] || "/";
  };

  const TaskIcon = getTaskIcon(task.type);
  const isOverdue = task.isOverdue || false;
  const isDueSoon = task.isDueSoon || false;

  // Calculate days remaining/overdue
  const getDaysStatus = () => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "#ef4444", icon: AlertCircle };
    } else if (diffDays <= 2) {
      return { text: `${diffDays} days remaining`, color: "#f59e0b", icon: Clock };
    } else {
      return { text: `${diffDays} days remaining`, color: "#10b981", icon: CheckCircle };
    }
  };

  const daysStatus = getDaysStatus();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: isOverdue ? "#fee2e2" : isDueSoon ? "#fef3c7" : "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isOverdue ? "#dc2626" : isDueSoon ? "#d97706" : "#2563eb",
              }}
            >
              <TaskIcon size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                {task.title || `Task ${task.id}`}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                {task.type?.charAt(0).toUpperCase() + task.type?.slice(1)} Task
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "8px",
              color: "#6b7280",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Badge */}
        {(isOverdue || isDueSoon || daysStatus) && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              backgroundColor: isOverdue ? "#fee2e2" : isDueSoon ? "#fef3c7" : "#d1fae5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: isOverdue ? "#991b1b" : isDueSoon ? "#92400e" : "#065f46",
            }}
          >
            {daysStatus && (
              <>
                <daysStatus.icon size={20} />
                <span style={{ fontWeight: 600 }}>{daysStatus.text}</span>
              </>
            )}
            {isOverdue && (
              <>
                <AlertCircle size={20} />
                <span style={{ fontWeight: 600 }}>Overdue</span>
              </>
            )}
            {isDueSoon && !isOverdue && (
              <>
                <Clock size={20} />
                <span style={{ fontWeight: 600 }}>Due Soon</span>
              </>
            )}
          </div>
        )}

        {/* Task Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          <DetailRow label="Dealer" value={task.dealerName || "N/A"} />
          <DetailRow label="Entity ID" value={task.entityId || "N/A"} />
          {task.stage && <DetailRow label="Current Stage" value={task.stage.replace(/_/g, " ")} />}
          {task.priority && <DetailRow label="Priority" value={task.priority} />}
          {task.createdAt && (
            <DetailRow
              label="Created"
              value={new Date(task.createdAt).toLocaleString()}
            />
          )}
          {task.dueDate && (
            <DetailRow
              label="Due Date"
              value={new Date(task.dueDate).toLocaleString()}
            />
          )}
          {task.description && <DetailRow label="Description" value={task.description} />}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
          <button
            onClick={() => {
              navigate(getTaskRoute(task));
              onClose();
            }}
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View Details
          </button>
          {onAction && (
            <button
              onClick={() => {
                onAction(task);
                onClose();
              }}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Take Action
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
      <span style={{ color: "#6b7280", fontWeight: 500 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

