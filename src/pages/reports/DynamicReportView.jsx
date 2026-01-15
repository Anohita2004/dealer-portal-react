import React, { useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

export default function DynamicReportView({
    title,
    data,
    loading,
    error,
    fetchReport,
    columns = []
}) {
    useEffect(() => {
        if (!data) fetchReport();
    }, []); // eslint-disable-line

    if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
    if (!data) return null;

    const rows = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
            ? data
            : data.items || [];

    return (
        <Box mt={3}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold">{title}</Typography>
                <Divider sx={{ my: 1 }} />

                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "action.hover" }}>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell key={col.field} sx={{ fontWeight: "bold" }}>
                                        {col.headerName}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length > 0 ? (
                                rows.map((row, idx) => (
                                    <TableRow key={idx}>
                                        {columns.map((col) => (
                                            <TableCell key={col.field}>
                                                {col.render
                                                    ? col.render(row[col.field], row)
                                                    : row[col.field] || "—"}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">No data found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
