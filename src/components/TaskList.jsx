import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, Chip, Tabs, Tab } from "@mui/material";
import { taskAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

const TaskList = ({ compact = false }) => {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.getTasks();
      
      // Enhance tasks with overdue/due soon indicators
      const enhancedTasks = {
        ...data,
        tasks: (data.tasks || []).map((task) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          const now = new Date();
          
          let isOverdue = false;
          let isDueSoon = false;
          
          if (dueDate) {
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            isOverdue = diffDays < 0;
            isDueSoon = diffDays >= 0 && diffDays <= 2;
          }
          
          return {
            ...task,
            isOverdue,
            isDueSoon,
            dueDate: task.dueDate || task.dueAt,
          };
        }),
      };
      
      setTasks(enhancedTasks);
    } catch (error) {
      // Silently handle errors - backend might not be ready or user might not have access
      setTasks({ tasks: [], total: 0, byType: {} });
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeLabel = (type) => {
    const labels = {
      order: "Order",
      invoice: "Invoice",
      payment: "Payment",
      document: "Document",
      pricing: "Pricing",
    };
    return labels[type] || type;
  };

  const getTaskRoute = (task) => {
    const routes = {
      order: `/orders/approvals`,
      invoice: `/invoices`,
      payment: `/payments/finance/pending`,
      document: `/documents`,
      pricing: `/pricing`,
    };
    return routes[task.type] || "/";
  };

  const filteredTasks = tasks?.tasks?.filter((task) => {
    if (selectedTab === "all") return true;
    return task.type === selectedTab;
  }) || [];

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  if (!tasks || !tasks.tasks || tasks.tasks.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No pending tasks
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Pending Tasks ({tasks.total || 0})
        </Typography>
        {tasks.byType && (
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            {Object.entries(tasks.byType).map(([type, count]) => (
              <Chip
                key={type}
                label={`${getTaskTypeLabel(type)}: ${count}`}
                size="small"
                onClick={() => navigate(getTaskRoute({ type }))}
                clickable
              />
            ))}
          </Box>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {tasks.tasks.slice(0, 5).map((task) => (
            <Card
              key={task.id}
              sx={{ 
                cursor: "pointer",
                borderLeft: task.isOverdue ? "4px solid #ef4444" : task.isDueSoon ? "4px solid #f59e0b" : "4px solid transparent",
                "&:hover": { boxShadow: 4 }
              }}
              onClick={() => setSelectedTask(task)}
            >
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.dealerName} • {new Date(task.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {task.isOverdue && (
                    <AlertCircle size={16} color="#ef4444" style={{ marginLeft: "0.5rem" }} />
                  )}
                  {task.isDueSoon && !task.isOverdue && (
                    <Clock size={16} color="#f59e0b" style={{ marginLeft: "0.5rem" }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pending Tasks ({tasks.total || 0})
      </Typography>

      <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
        <Tab label="All" value="all" />
        {tasks.byType &&
          Object.keys(tasks.byType).map((type) => (
            <Tab
              key={type}
              label={`${getTaskTypeLabel(type)} (${tasks.byType[type]})`}
              value={type}
            />
          ))}
      </Tabs>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            sx={{ 
              cursor: "pointer", 
              "&:hover": { boxShadow: 4 },
              borderLeft: task.isOverdue ? "4px solid #ef4444" : task.isDueSoon ? "4px solid #f59e0b" : "4px solid transparent",
            }}
            onClick={() => setSelectedTask(task)}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="h6" gutterBottom={false}>
                      {task.title}
                    </Typography>
                    {task.isOverdue && (
                      <Chip
                        icon={<AlertCircle size={14} />}
                        label="Overdue"
                        size="small"
                        sx={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                      />
                    )}
                    {task.isDueSoon && !task.isOverdue && (
                      <Chip
                        icon={<Clock size={14} />}
                        label="Due Soon"
                        size="small"
                        sx={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Dealer: {task.dealerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(task.createdAt).toLocaleString()}
                    {task.dueDate && (
                      <> • Due: {new Date(task.dueDate).toLocaleString()}</>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                  <Chip
                    label={getTaskTypeLabel(task.type)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {task.stage && (
                    <Chip
                      label={`Stage: ${task.stage.replace("_", " ")}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAction={(task) => navigate(getTaskRoute(task))}
        />
      )}
    </Box>
  );
};

export default TaskList;

