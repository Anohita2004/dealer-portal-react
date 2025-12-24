import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  IconButton,
} from "@mui/material";
import { Search, RefreshCw, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";

export default function RegionalPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let res;
      try {
        // Payments are workflow-driven - no generic /api/payments endpoint
        // Regional managers should use finance pending or dealer pending endpoints
        // If those don't work, show empty state gracefully
        res = await paymentAPI.getFinancePending();
      } catch (e) {
        // 404 = endpoint doesn't exist - show empty
        // 403 = role restriction - show empty
        if (e?.response?.status === 404 || e?.response?.status === 403) {
          setPayments([]);
          setTotalPages(1);
          return;
        }
        throw e;
      }

      let list = Array.isArray(res) ? res : res.pending || res.payments || res.data || res || [];

      // Filter by workflow stage for regional manager
      if (role === "regional_manager") {
        const filtered = [];
        for (const payment of list) {
          try {
            const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
            const workflow = workflowRes.workflow || workflowRes.data || workflowRes;
            const currentStage = workflow?.currentStage;
            const normalize = (str) => String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
            const normStage = normalize(currentStage);

            // Workflow pipeline: dealer_admin (1), sales_exe (2), territory_manager (3), area_manager (4), regional_manager (5)...
            let isUserTurn = normStage === "regionalmanager";
            if (!isUserTurn && normStage.startsWith("stage")) {
              const stageNum = parseInt(normStage.replace(/\D/g, ''), 10);
              isUserTurn = stageNum === 5; // Regional Manager is Stage 5
            }

            if (isUserTurn) {
              filtered.push(payment);
            }
          } catch (err) {
            if ((payment.status || "").toLowerCase() === "pending") filtered.push(payment);
          }
        }
        list = filtered;
      }

      setPayments(list);
      setTotalPages(Math.ceil(list.length / pageSize));
    } catch (error) {
      // Only log non-permission errors
      if (error?.response?.status !== 403 && error?.response?.status !== 404) {
        console.error("Failed to fetch payments:", error);
        toast.error("Failed to load payments");
      }
      setPayments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      reconciled: "info",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Payments"
        subtitle="View payment requests in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
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
                <MenuItem value="reconciled">Reconciled</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={() => fetchPayments()}>
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment #</TableCell>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentNumber || payment.id}</TableCell>
                      <TableCell>
                        {payment.dealer?.businessName || payment.dealerName || "N/A"}
                      </TableCell>
                      <TableCell>
                        {payment.invoice?.invoiceNumber || payment.invoiceId || "N/A"}
                      </TableCell>
                      <TableCell>
                        ₹{Number(payment.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{payment.paymentMode || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status || "pending"}
                          size="small"
                          color={getStatusColor(payment.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/payments/${payment.id}`)}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

