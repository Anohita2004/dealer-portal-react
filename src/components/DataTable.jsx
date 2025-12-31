import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Skeleton,
  TablePagination
} from "@mui/material";

/**
 * DataTable Component
 * A wrapper around MUI Table that supports DataGrid-style column definitions
 * 
 * @param {Array} columns - Column definitions { field, headerName, renderCell, flex, width }
 * @param {Array} rows - Data rows
 * @param {Boolean} loading - Loading state
 * @param {String} emptyMessage - Message to show when no data
 * @param {Function} onRowClick - Optional click handler
 * @param {Object} pagination - Pagination state and handlers
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  pagination
}) {
  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              {columns.map((col, i) => (
                <TableCell key={i} sx={{ fontWeight: 600 }}>{col.headerName || col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {columns.map((col, i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              {columns.map((col) => (
                <TableCell
                  key={col.field || col.key}
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    width: col.width || "auto",
                    minWidth: col.minWidth || "auto",
                  }}
                >
                  {col.headerName || col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                hover
                onClick={() => onRowClick && onRowClick(row)}
                sx={{
                  cursor: onRowClick ? "pointer" : "default",
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.field || col.key}>
                    {col.renderCell
                      ? col.renderCell({ row, value: row[col.field || col.key] })
                      : col.render
                        ? col.render(row[col.key || col.field], row)
                        : row[col.field || col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          onPageChange={(e, newPage) => pagination.onPageChange && pagination.onPageChange(newPage + 1)}
          rowsPerPage={pagination.limit || 10}
          onRowsPerPageChange={(e) => pagination.onLimitChange && pagination.onLimitChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Box>
  );
}
