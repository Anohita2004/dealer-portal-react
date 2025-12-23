import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { useMyDealers } from "../../hooks/useMyDealers";

export default function MyDealersPage() {
  const { dealers, loading, error } = useMyDealers();

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="My Dealers"
        subtitle="View dealers assigned to you as a Sales Executive"
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Card>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {!loading && !error && dealers.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No dealers assigned. Please contact your manager if you believe this is an error.
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && !error && dealers.length > 0 && (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>City</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dealers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.dealerCode}</TableCell>
                    <TableCell>{d.businessName}</TableCell>
                    <TableCell>{d.city || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}


