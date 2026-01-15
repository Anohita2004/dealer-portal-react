import React, { useEffect, useState, useMemo } from "react";
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
    TableSortLabel,
    TextField,
    InputAdornment,
    TablePagination,
    Stack,
    Skeleton,
    alpha,
    useTheme
} from "@mui/material";
import { Search, Filter, AlertCircle, FileText } from "lucide-react";

export default function DynamicReportView({
    title,
    data,
    loading,
    error,
    fetchReport,
    columns = []
}) {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState("");
    const [orderBy, setOrderBy] = useState("");
    const [order, setOrder] = useState("asc");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        if (!data) fetchReport();
    }, []); // eslint-disable-line

    const rows = useMemo(() => {
        if (!data) return [];
        const rawRows = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
                ? data
                : data.items || [];
        return rawRows;
    }, [data]);

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const filteredRows = useMemo(() => {
        return rows.filter((row) =>
            Object.values(row).some(
                (val) =>
                    val &&
                    val.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [rows, searchTerm]);

    const sortedRows = useMemo(() => {
        const sorted = [...filteredRows];
        if (orderBy) {
            sorted.sort((a, b) => {
                const aValue = a[orderBy] || "";
                const bValue = b[orderBy] || "";
                if (bValue < aValue) return order === "desc" ? -1 : 1;
                if (bValue > aValue) return order === "desc" ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredRows, orderBy, order]);

    const paginatedRows = useMemo(() => {
        return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedRows, page, rowsPerPage]);

    if (error) {
        return (
            <Box sx={{ mt: 3, p: 4, textAlign: "center", bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 3 }}>
                <AlertCircle size={48} color={theme.palette.error.main} style={{ marginBottom: 16 }} />
                <Typography variant="h6" color="error" gutterBottom>Report Loading Error</Typography>
                <Typography color="text.secondary">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box mt={3}>
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.04)}`
            }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 3 }}>
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: 'flex' }}>
                                <FileText size={20} />
                            </Box>
                            <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: -0.5 }}>{title}</Typography>
                        </Stack>
                    </Box>

                    <TextField
                        size="small"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ minWidth: { md: 300 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3, bgcolor: 'background.paper' }
                        }}
                    />
                </Stack>

                <TableContainer sx={{
                    maxHeight: 600,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, 0.6)
                }}>
                    <Table stickyHeader size="medium">
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.field}
                                        sx={{
                                            fontWeight: "800",
                                            bgcolor: alpha(theme.palette.background.paper, 0.95),
                                            color: theme.palette.text.secondary,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            borderBottom: `2px solid ${theme.palette.divider}`
                                        }}
                                        sortDirection={orderBy === col.field ? order : false}
                                    >
                                        <TableSortLabel
                                            active={orderBy === col.field}
                                            direction={orderBy === col.field ? order : "asc"}
                                            onClick={() => handleSort(col.field)}
                                        >
                                            {col.headerName}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((col) => (
                                            <TableCell key={col.field}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : paginatedRows.length > 0 ? (
                                paginatedRows.map((row, idx) => (
                                    <TableRow
                                        key={idx}
                                        hover
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            transition: 'background-color 0.2s',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) }
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <TableCell key={col.field} sx={{ fontWeight: 500 }}>
                                                {col.render
                                                    ? col.render(row[col.field], row)
                                                    : row[col.field] || <Typography variant="body2" color="text.disabled">—</Typography>}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 10 }}>
                                        <Stack spacing={2} alignItems="center">
                                            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'action.hover' }}>
                                                <Search size={40} color={theme.palette.text.disabled} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" color="text.secondary">No matching records found</Typography>
                                                <Typography variant="body2" color="text.disabled">Try adjusting your search or filters</Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={sortedRows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 1 }}
                />
            </Paper>
        </Box>
    );
}
