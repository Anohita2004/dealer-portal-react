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
import { getPaymentStatusDisplay } from "../../utils/paymentStatus";

export default function TerritoryPayments() {
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
        res = await paymentAPI.getFinancePending();
      } catch (e) {
        setPayments([]);
        setTotalPages(1);
        return;
      }

      let list = Array.isArray(res) ? res : res.pending || res.payments || res.data || res || [];

      // Filter by workflow stage for territory manager
      if (role === "territory_manager") {
        const filtered = [];
        for (const payment of list) {
          try {
            const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
            const workflow = workflowRes.workflow || workflowRes.data || workflowRes;
            const currentStage = workflow?.currentStage;
            const normalize = (str) => String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
            const normStage = normalize(currentStage);

            // Workflow pipeline: dealer_admin (1), sales_exe (2), territory_manager (3)...
            let isUserTurn = normStage === "territorymanager";
            if (!isUserTurn && normStage.startsWith("stage")) {
              const stageNum = parseInt(normStage.replace(/\D/g, ''), 10);
              isUserTurn = stageNum === 3; // Territory Manager is Stage 3
            }

            if (isUserTurn) {
              filtered.push({ ...payment, workflow });
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
      console.error("Failed to fetch payments:", error);
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

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.paymentNumber || payment.id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.dealer?.businessName || payment.dealerName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const s = (payment.status || "").toLowerCase();
    const as = (payment.approvalStatus || "").toLowerCase();
    const matchesStatus =
      statusFilter === "all" || s === statusFilter || as === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Territory Payments"
        subtitle="View payment requests in your territory"
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
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
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
                        {(() => {
                          const statusInfo = getPaymentStatusDisplay(payment, payment.workflow);
                          return (
                            <Chip
                              label={statusInfo.label}
                              size="small"
                              color={statusInfo.color}
                            />
                          );
                        })()}
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

