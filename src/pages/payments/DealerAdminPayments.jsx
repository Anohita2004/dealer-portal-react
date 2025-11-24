import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@mui/material";
import api from "../../services/api";

export default function DealerAdminPayments() {
  const [payments, setPayments] = useState([]);

  const loadData = async () => {
    const res = await api.get("/payments/dealer/pending");
    setPayments(res.data.pending);
  };

  useEffect(() => {
    loadData();
  }, []);

  const reviewPayment = async (id, action) => {
    await api.post(`/payments/dealer/${id}/review`, { action });
    loadData();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>
        Pending Payment Requests (Dealer Admin)
      </Typography>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Mode</TableCell>
                <TableCell>Proof</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.Invoice?.invoiceNumber}</TableCell>
                  <TableCell>₹{p.amount}</TableCell>
                  <TableCell>{p.paymentMode}</TableCell>
                  <TableCell>
                    {p.proofFile && (
                      <a href={p.proofFile} target="_blank" rel="noreferrer">
                        View
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="success"
                      onClick={() => reviewPayment(p.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      color="error"
                      onClick={() => reviewPayment(p.id, "reject")}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
