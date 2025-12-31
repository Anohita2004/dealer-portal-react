import React, { useState, useEffect, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import DataTable from "./DataTable";

/**
 * ScopedDataTable - Displays data fetched via a provided function
 * 
 * NEW: Accepts fetchFn (async function) - preferred for workflow-driven endpoints
 * OLD: Accepts endpoint (string) - deprecated, builds URLs like /api/{resource}
 * 
 * Handles 403/404 gracefully without crashing
 */
const ScopedDataTable = ({
  fetchFn, // NEW: async function that accepts { page, limit } and returns { data, total } or array
  endpoint, // DEPRECATED: string endpoint path (e.g., "/orders") - will build URL
  columns,
  title,
  onRowClick,
  refreshTrigger,
  filters = {},
  search = "",
  ...props
}) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Use refs to track function references without causing dependency issues
  const fetchFnRef = useRef(fetchFn);
  const endpointRef = useRef(endpoint);

  // Update refs when props change
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    endpointRef.current = endpoint;
  }, [fetchFn, endpoint]);

  // Memoize filters string to avoid unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, refreshTrigger, filtersString, search]);

  const fetchData = async () => {
    // Prefer fetchFn over endpoint - use refs to get current values
    const currentFetchFn = fetchFnRef.current;
    const currentEndpoint = endpointRef.current;

    if (currentFetchFn && typeof currentFetchFn === "function") {
      try {
        setLoading(true);
        setError(null);

        const result = await currentFetchFn({
          page: pagination.page,
          limit: pagination.limit,
          search: search,
          ...filters
        });

        // Handle different response formats
        if (result && result.data) {
          setData(Array.isArray(result.data) ? result.data : []);
          setPagination((prev) => ({
            ...prev,
            total: result.total || result.totalCount || result.data.length || 0,
          }));
        } else if (Array.isArray(result)) {
          setData(result);
          setPagination((prev) => ({
            ...prev,
            total: result.length,
          }));
        } else if (result && typeof result === "object") {
          // Flexible key detection for common resources
          const dataKey = ["orders", "invoices", "payments", "dealers", "users", "items"].find(
            (key) => Array.isArray(result[key])
          );

          if (dataKey) {
            setData(result[dataKey]);
            setPagination((prev) => ({
              ...prev,
              total: result.total || result.totalCount || result[dataKey].length || 0,
            }));
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (error) {
        // 404 = endpoint doesn't exist - remove data source silently
        // 403 = role restriction - hide table or show role-safe message
        if (error?.response?.status === 404) {
          setError("Data source not available");
          setData([]);
        } else if (error?.response?.status === 403) {
          setError("Access restricted");
          setData([]);
        } else {
          // Only log non-permission errors
          console.error("Error fetching scoped data:", error);
          setError("Failed to load data");
          setData([]);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // DEPRECATED: Legacy endpoint-based fetching (for backward compatibility)
    if (!currentEndpoint) {
      setError("No fetch function or endpoint provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filterParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: search,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            filterParams.append(key, value.join(','));
          } else {
            filterParams.append(key, value);
          }
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}${currentEndpoint}?${filterParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        // 404 = endpoint doesn't exist
        // 403 = role restriction
        if (response.status === 404) {
          setError("Data source not available");
          setData([]);
          return;
        } else if (response.status === 403) {
          setError("Access restricted");
          setData([]);
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();

      // Handle different response formats
      if (result.data) {
        setData(Array.isArray(result.data) ? result.data : []);
        setPagination((prev) => ({
          ...prev,
          total: result.total || result.data.length || 0,
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
      // 404/403 already handled above
      if (error?.response?.status !== 404 && error?.response?.status !== 403) {
        console.error("Error fetching scoped data:", error);
        setError("Failed to load data");
      }
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

  // If error is 403 or 404, don't show the table
  if (error && (error === "Access restricted" || error === "Data source not available")) {
    return null; // Hide table for permission/endpoint issues
  }

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
      {error && error !== "Access restricted" && error !== "Data source not available" && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "error.light", borderRadius: 1 }}>
          <Typography variant="caption" color="error.dark">
            {error}
          </Typography>
        </Box>
      )}
      <DataTable
        rows={data}
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

