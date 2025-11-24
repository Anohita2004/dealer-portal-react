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
// ======================== ORDER FLOW APIs (FIXED) =======================
// =======================================================================

export const orderAPI = {
  // Dealer creates order
  createOrder: (payload) =>
    api.post("/orders", payload).then((r) => r.data),

  // Dealer views own orders
  getMyOrders: () =>
    api.get("/orders/my", { params: { mine: true } }).then((r) => r.data),

  // Admin/Manager view all orders
  getAllOrders: (params) =>
    api.get("/orders", { params }).then((r) => r.data),

  // Admin/Manager update status
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  // Admin approves order
  approveOrder: (id) =>
    api.patch(`/orders/${id}/approve`).then((r) => r.data),

  // Admin rejects order
  rejectOrder: (id, reason) =>
    api.patch(`/orders/${id}/reject`, { reason }).then((r) => r.data),
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
/* =======================================================================
   INVOICE / PAYMENT APIs
   ======================================================================= */

export const invoiceAPI = {
  // Create invoice (dealer_staff may call with { orderId } — backend derives other fields)
  createInvoice: (payload) => api.post('/invoices', payload).then((r) => r.data),

  // Get invoices (list) - supports query params
  getInvoices: (params) => api.get('/invoices', { params }).then((r) => r.data),

  // Get single invoice by id
  getInvoiceById: (id) => api.get(`/invoices/${id}`).then((r) => r.data),

  // Update invoice (admin / key_user)
  updateInvoice: (id, payload) => api.put(`/invoices/${id}`, payload).then((r) => r.data),

  // Download invoice PDF — returns ArrayBuffer blob
  downloadInvoicePDF: (id) =>
    api
      .get(`/invoices/${id}/pdf`, { responseType: 'arraybuffer' })
      .then((r) => r.data),
};
// Default export for compatibility
export default api;

// ======================= CHAT APIs (resilient mark-read) =================
export const chatAPI = {
  // Try several endpoint variants to mark a conversation as read.
  // Some backends expose different paths or use POST instead of PATCH.
  // We attempt likely candidates and ignore 404s.
  markRead: async (partnerId) => {
    const candidates = [
      // Prefer the backend's declared route: PATCH /api/chat/:partnerId/read
      { method: "patch", url: `/chat/${partnerId}/read` },

      // original chat endpoints (fallbacks)
      { method: "patch", url: `/chat/mark-read/${partnerId}` },
      { method: "post", url: `/chat/mark-read/${partnerId}` },
      { method: "post", url: `/chat/${partnerId}/read` },
      { method: "patch", url: `/chat/read/${partnerId}` },
      { method: "post", url: `/chat/read/${partnerId}` },

      // messages-based endpoints (used elsewhere in repo)
      { method: "patch", url: `/messages/mark-read/${partnerId}` },
      { method: "post", url: `/messages/mark-read/${partnerId}` },
      { method: "patch", url: `/messages/${partnerId}/read` },
      { method: "post", url: `/messages/${partnerId}/read` },
      { method: "patch", url: `/messages/read/${partnerId}` },
      { method: "post", url: `/messages/read/${partnerId}` },

      // conversation-based endpoints
      { method: "patch", url: `/conversations/${partnerId}/read` },
      { method: "post", url: `/conversations/${partnerId}/read` },
      { method: "patch", url: `/conversations/mark-read/${partnerId}` },
      { method: "post", url: `/conversations/mark-read/${partnerId}` },

      // query param variants
      { method: "patch", url: `/chat/mark-read?partnerId=${partnerId}` },
      { method: "post", url: `/chat/mark-read?partnerId=${partnerId}` },

      // snake_case variants
      { method: "patch", url: `/chat/mark_as_read/${partnerId}` },
      { method: "post", url: `/chat/mark_as_read/${partnerId}` },
    ];

    let lastErr = null;
    for (const c of candidates) {
      try {
        const res = await api[c.method](c.url);
        // helpful debug: which candidate succeeded
        console.debug(`[chatAPI.markRead] succeeded: ${c.method.toUpperCase()} ${c.url}`);
        return res.data;
      } catch (err) {
        lastErr = err;
        if (err.response && err.response.status === 404) continue;
      }
    }

    return Promise.reject(lastErr || new Error("Failed to mark chat read"));
  },
};
