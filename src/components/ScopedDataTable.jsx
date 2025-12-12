import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import DataTable from "./DataTable";

/**
 * ScopedDataTable - Automatically filters data based on user role
 * The backend handles scoping, so we just need to call the endpoint
 * without any manual filtering
 */
const ScopedDataTable = ({
  endpoint,
  columns,
  title,
  onRowClick,
  refreshTrigger,
  ...props
}) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    fetchData();
  }, [endpoint, pagination.page, pagination.limit, refreshTrigger]);

  const fetchData = async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}${endpoint}?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      
      // Handle different response formats
      if (result.data) {
        setData(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.total || result.data.length,
        }));
      } else if (Array.isArray(result)) {
        setData(result);
        setPagination((prev) => ({
          ...prev,
          total: result.length,
        }));
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching scoped data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Show scope indicator (UI/UX recommendation from guide)
  const getScopeIndicator = () => {
    if (!user) return null;

    const scopeParts = [];
    if (user.regionId) scopeParts.push("Region");
    if (user.areaId) scopeParts.push("Area");
    if (user.territoryId) scopeParts.push("Territory");
    if (user.dealerId) scopeParts.push("Dealer");

    if (scopeParts.length === 0 && user.role === "super_admin") {
      return "Viewing: All Data";
    }

    return scopeParts.length > 0
      ? `Viewing: ${scopeParts[scopeParts.length - 1]} Scope`
      : null;
  };

  return (
    <div>
      {getScopeIndicator() && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: "info.light",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "info.main",
          }}
        >
          <Typography variant="caption" color="info.dark" fontWeight="medium">
            {getScopeIndicator()}
          </Typography>
        </Box>
      )}
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        title={title}
        onRowClick={onRowClick}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        {...props}
      />
    </div>
  );
};

export default ScopedDataTable;

