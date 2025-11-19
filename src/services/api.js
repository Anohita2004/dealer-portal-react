import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ====== INTERCEPTORS (keep as is) ======
api.interceptors.request.use((config) => {
  const noAuthNeeded = [
    "/auth/login",
    "/auth/verify-otp",
    "/auth/reset-password",
    "/auth/reset-password-confirm",
  ];

  if (!noAuthNeeded.some((path) => config.url.includes(path))) {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalUrl = err.config?.url || "";

    const safeRoutes = ["/auth/login", "/auth/verify-otp"];
    const isSafe = safeRoutes.some((path) => originalUrl.includes(path));

    if (err.response?.status === 401 && !isSafe) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.history.pushState({}, "", "/login");
    }

    return Promise.reject(err);
  }
);

// =======================================================================
// ======================= MATERIAL MASTER APIs ===========================
// =======================================================================

export const materialAPI = {
  getMaterials: () => api.get("/materials").then((r) => r.data),
  getMaterialGroups: () => api.get("/material-groups").then((r) => r.data),

  createMaterial: (payload) =>
    api.post("/materials", payload).then((r) => r.data),

  updateMaterial: (id, payload) =>
    api.patch(`/materials/${id}`, payload).then((r) => r.data),

  deleteMaterial: (id) =>
    api.delete(`/materials/${id}`).then((r) => r.data),
  


};

// =======================================================================
// ======================== ORDER FLOW APIs ===============================
// =======================================================================

export const orderAPI = {
  // Dealer creates order
  createOrder: (payload) =>
    api.post("/orders", payload).then((r) => r.data),

  // Dealer views own orders
  getMyOrders: () =>
    api.get("/orders/my").then((r) => r.data),

  // Admin views all / pending orders
  getAllOrders: (params) =>
    api.get("/orders", { params }).then((r) => r.data),

  getOrderById: (id) =>
    api.get(`/orders/${id}`).then((r) => r.data),

  // Admin modifies order qty before approval
  updateOrder: (id, payload) =>
    api.patch(`/orders/${id}`, payload).then((r) => r.data),

  approveOrder: (id) =>
    api.patch(`/orders/${id}/approve`).then((r) => r.data),

  rejectOrder: (id, payload) =>
    api.patch(`/orders/${id}/reject`, payload).then((r) => r.data),
};

// =======================================================================
// ======================= NOTIFICATIONS APIs =============================
// =======================================================================

export const notificationAPI = {
  getNotifications: () =>
    api.get("/notifications").then((r) => r.data),

  markNotificationRead: (id) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),
};

// Default export for compatibility
export default api;
