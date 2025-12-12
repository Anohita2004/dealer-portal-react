import { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

/**
 * Enhanced API call hook with:
 * - JWT injection (automatic via axios interceptor)
 * - Error handling
 * - Loading states
 * - Multipart support
 * - Automatic scoping params
 * - Token refresh handling
 */
export const useApiCall = (options = {}) => {
  // Safely get auth context (may be null if used outside AuthProvider)
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const logout = authContext?.logout || (() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  });
  const refreshToken = authContext?.refreshToken;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    showToast = true,
    showErrorToast = true,
    autoScope = false, // Automatically add user scope params
  } = options;

  /**
   * Handle API errors with proper user feedback
   */
  const handleError = useCallback(
    (err, defaultMessage = "An error occurred") => {
      let errorMessage = defaultMessage;
      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 401) {
        // Token expired - try refresh if available, otherwise logout
        if (refreshToken) {
          refreshToken()
            .then(() => {
              if (showErrorToast) {
                toast.info("Session refreshed. Please retry.");
              }
            })
            .catch(() => {
              logout();
              if (showErrorToast) {
                toast.error("Session expired. Please login again.");
              }
            });
        } else {
          logout();
          if (showErrorToast) {
            toast.error("Session expired. Please login again.");
          }
        }
        errorMessage = "Session expired. Please login again.";
      } else if (status === 403) {
        errorMessage = errorData?.error || errorData?.message || "You do not have permission to perform this action";
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      } else if (status === 404) {
        errorMessage = errorData?.error || errorData?.message || "Resource not found";
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      } else if (status === 422) {
        // Validation error
        errorMessage = errorData?.error || errorData?.message || "Validation error";
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      } else if (status >= 500) {
        errorMessage = errorData?.error || errorData?.message || "Server error. Please try again later.";
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      } else {
        errorMessage = errorData?.error || errorData?.message || err.message || defaultMessage;
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      }

      setError(errorMessage);
      return errorMessage;
    },
    [logout, refreshToken, showErrorToast]
  );

  /**
   * Add automatic scoping params based on user role
   */
  const addScopeParams = useCallback(
    (params = {}) => {
      if (!autoScope || !user) return params;

      const scopeParams = { ...params };

      // Add user scope IDs if they exist
      if (user.regionId) scopeParams.regionId = user.regionId;
      if (user.areaId) scopeParams.areaId = user.areaId;
      if (user.territoryId) scopeParams.territoryId = user.territoryId;
      if (user.dealerId) scopeParams.dealerId = user.dealerId;

      return scopeParams;
    },
    [autoScope, user]
  );

  /**
   * Main API call function
   * @param {string} endpoint - API endpoint (e.g., '/orders', '/users/123')
   * @param {object} config - Request configuration
   * @param {string} config.method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {object} config.data - Request body data
   * @param {object} config.params - Query parameters
   * @param {boolean} config.multipart - Whether to send as multipart/form-data
   * @param {object} config.headers - Additional headers
   */
  const call = useCallback(
    async (endpoint, config = {}) => {
      setLoading(true);
      setError(null);

      try {
        const {
          method = "GET",
          data,
          params,
          multipart = false,
          headers = {},
          ...restConfig
        } = config;

        // Prepare request config
        const requestConfig = {
          method: method.toLowerCase(),
          url: endpoint,
          ...restConfig,
        };

        // Add scoped params if enabled
        if (params || autoScope) {
          requestConfig.params = addScopeParams(params);
        }

        // Handle multipart/form-data
        if (multipart && data) {
          const formData = new FormData();
          Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
              if (data[key] instanceof File || data[key] instanceof Blob) {
                formData.append(key, data[key]);
              } else if (Array.isArray(data[key])) {
                data[key].forEach((item, index) => {
                  if (item instanceof File || item instanceof Blob) {
                    formData.append(`${key}[${index}]`, item);
                  } else {
                    formData.append(`${key}[${index}]`, JSON.stringify(item));
                  }
                });
              } else {
                formData.append(key, typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key]);
              }
            }
          });
          requestConfig.data = formData;
          requestConfig.headers = {
            ...headers,
            "Content-Type": "multipart/form-data",
          };
        } else if (data) {
          requestConfig.data = data;
          if (!multipart && !headers["Content-Type"]) {
            requestConfig.headers = {
              ...headers,
              "Content-Type": "application/json",
            };
          } else {
            requestConfig.headers = headers;
          }
        } else {
          requestConfig.headers = headers;
        }

        // Make the API call
        const response = await api(requestConfig);

        // Success response
        if (showToast && method !== "GET") {
          toast.success("Operation completed successfully");
        }

        // Return response data
        return response.data;
      } catch (err) {
        console.error("API call error:", err);
        const errorMsg = handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addScopeParams, autoScope, handleError, showToast]
  );

  /**
   * Convenience methods for common HTTP methods
   */
  const get = useCallback(
    (endpoint, params = {}) => {
      return call(endpoint, { method: "GET", params });
    },
    [call]
  );

  const post = useCallback(
    (endpoint, data = {}, config = {}) => {
      return call(endpoint, { method: "POST", data, ...config });
    },
    [call]
  );

  const put = useCallback(
    (endpoint, data = {}, config = {}) => {
      return call(endpoint, { method: "PUT", data, ...config });
    },
    [call]
  );

  const patch = useCallback(
    (endpoint, data = {}, config = {}) => {
      return call(endpoint, { method: "PATCH", data, ...config });
    },
    [call]
  );

  const del = useCallback(
    (endpoint, config = {}) => {
      return call(endpoint, { method: "DELETE", ...config });
    },
    [call]
  );

  /**
   * Upload file(s) - convenience method for multipart
   */
  const upload = useCallback(
    (endpoint, formData, config = {}) => {
      return call(endpoint, {
        method: "POST",
        data: formData,
        multipart: true,
        ...config,
      });
    },
    [call]
  );

  return {
    call,
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useApiCall;

