import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Box,
  Skeleton,
  TablePagination
} from "@mui/material";
import EmptyState from "./EmptyState";
import { motion } from "framer-motion";

/**
 * Premium DataTable Component
 * Enhanced with better loading states and empty views
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
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden"
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              {columns.map((col, i) => (
                <TableCell key={i} sx={{ fontWeight: 600, py: 2 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {columns.map((col, i) => (
                  <TableCell key={i} sx={{ py: 2 }}>
                    <Skeleton
                      variant="rectangular"
                      width={i === 0 ? "80%" : "40%"}
                      height={20}
                      sx={{ borderRadius: "var(--radius-sm)" }}
                    />
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
      <EmptyState
        title="No Results Found"
        description={emptyMessage}
        icon="📊"
      />
    );
  }

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              {columns.map((col) => (
                <TableCell
                  key={col.field || col.key}
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    width: col.width || "auto",
                    minWidth: col.minWidth || "auto",
                    py: 2,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em'
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
                component={motion.tr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={row.id || idx}
                hover
                onClick={() => onRowClick && onRowClick(row)}
                sx={{
                  cursor: onRowClick ? "pointer" : "default",
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                  }
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.field || col.key} sx={{ py: 2 }}>
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
          sx={{
            borderTop: 'none',
            color: 'text.secondary',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem',
              fontWeight: 500
            }
          }}
        />
      )}
    </Box>
  );
}

