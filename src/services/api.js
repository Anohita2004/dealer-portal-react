import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ====== INTERCEPTORS ======
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
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

// =======================================================================
// ======================== AUTHENTICATION APIs ==========================
// =======================================================================

export const authAPI = {
  // OTP Login Flow
  login: (username, password) =>
    api.post("/auth/login", { username, password }).then((r) => r.data),

  verifyOTP: (userId, otp) =>
    api.post("/auth/verify-otp", { userId, otp }).then((r) => r.data),

  resetPassword: (email) =>
    api.post("/auth/reset-password", { email }).then((r) => r.data),

  resetPasswordConfirm: (token, newPassword) =>
    api.post("/auth/reset-password-confirm", { token, newPassword }).then((r) => r.data),

  logout: () =>
    api.post("/auth/logout").then((r) => r.data),
};

// =======================================================================
// ======================== DASHBOARD APIs ===============================
// =======================================================================

export const dashboardAPI = {
  // Super Admin Dashboard
  getSuperAdminKPI: () =>
    api.get("/admin/reports/kpi-summary").then((r) => r.data),

  getUserActivity: () =>
    api.get("/admin/reports/user-activity").then((r) => r.data),

  getRoleDistribution: () =>
    api.get("/admin/reports/role-distribution").then((r) => r.data),

  getMonthlyGrowth: () =>
    api.get("/admin/reports/monthly-growth").then((r) => r.data),

  // Technical Admin Dashboard
  getPermissionMatrix: () =>
    api.get("/technical-admin/permissions/matrix").then((r) => r.data),

  getSystemAuditLogs: (params) =>
    api.get("/technical-admin/audit-logs", { params }).then((r) => r.data),

  // Manager Dashboards (Regional/Area/Territory)
  getManagerSummary: () =>
    api.get("/managers/summary").then((r) => r.data),

  getManagerApprovalQueue: () =>
    api.get("/managers/approval-queue").then((r) => r.data),

  // Dealer Dashboard
  getDealerDashboard: () =>
    api.get("/dealer/dashboard").then((r) => r.data),

  getDealerApprovals: () =>
    api.get("/dealer/approvals").then((r) => r.data),

  // Finance Admin Dashboard
  getFinanceDashboard: () =>
    api.get("/finance/dashboard").then((r) => r.data),

  // Accounts Dashboard
  getAccountsDashboard: () =>
    api.get("/accounts/dashboard").then((r) => r.data),

  // Inventory Dashboard
  getInventoryDashboard: () =>
    api.get("/inventory/dashboard").then((r) => r.data),
};

// =======================================================================
// ======================== USER MANAGEMENT APIs =========================
// =======================================================================

export const userAPI = {
  // Super Admin User Management
  getUsers: (params) =>
    api.get("/admin/users", { params }).then((r) => r.data),

  getUserById: (id) =>
    api.get(`/admin/users/${id}`).then((r) => r.data),

  createUser: (payload) =>
    api.post("/admin/users", payload).then((r) => r.data),

  updateUser: (id, payload) =>
    api.put(`/admin/users/${id}`, payload).then((r) => r.data),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  // Bulk operations
  bulkCreateUsers: (users) =>
    api.post("/admin/users/bulk", { users }).then((r) => r.data),

  // User activation/deactivation
  activateUser: (id) =>
    api.patch(`/admin/users/${id}/activate`).then((r) => r.data),

  deactivateUser: (id) =>
    api.patch(`/admin/users/${id}/deactivate`).then((r) => r.data),
};

// =======================================================================
// ======================== ROLE & PERMISSION APIs =======================
// =======================================================================

export const roleAPI = {
  getRoles: () =>
    api.get("/roles").then((r) => r.data),

  getPermissions: () =>
    api.get("/permissions").then((r) => r.data),

  getRolePermissions: (roleId) =>
    api.get(`/roles/${roleId}/permissions`).then((r) => r.data),

  updateRolePermissions: (roleId, permissions) =>
    api.post(`/roles/${roleId}/permissions`, { permissions }).then((r) => r.data),

  createRole: (payload) =>
    api.post("/roles", payload).then((r) => r.data),

  updateRole: (id, payload) =>
    api.put(`/roles/${id}`, payload).then((r) => r.data),

  deleteRole: (id) =>
    api.delete(`/roles/${id}`).then((r) => r.data),
};

// =======================================================================
// ======================== ORDER WORKFLOW APIs ==========================
// =======================================================================

export const orderAPI = {
  // Dealer creates order
  createOrder: (payload) =>
    api.post("/orders", payload).then((r) => r.data),

  // Dealer views own orders
  getMyOrders: (params) =>
    api.get("/orders/my", { params }).then((r) => r.data),

  // Admin/Manager view all orders (role-scoped)
  getAllOrders: (params) =>
    api.get("/orders", { params }).then((r) => r.data),

  // Get order by ID
  getOrderById: (id) =>
    api.get(`/orders/${id}`).then((r) => r.data),

  // Get pending approvals for current user's role
  getPendingApprovals: () =>
    api.get("/orders/approvals/pending").then((r) => r.data),

  // Approve order (multi-stage: Territory → Area → Regional → Super Admin)
  approveOrder: (id, payload) =>
    api.post(`/orders/${id}/approve`, payload).then((r) => r.data),

  // Reject order
  rejectOrder: (id, payload) =>
    api.post(`/orders/${id}/reject`, payload).then((r) => r.data),

  // Update order status
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  // Cancel order
  cancelOrder: (id, reason) =>
    api.post(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};

// =======================================================================
// ======================== PAYMENT WORKFLOW APIs ========================
// =======================================================================

export const paymentAPI = {
  // Dealer Staff: Create payment request
  createRequest: (formData) =>
    api.post("/payment/request", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Dealer: View own payment requests
  getMyRequests: (params) =>
    api.get("/payment/mine", { params }).then((r) => r.data),

  // Get payment by ID
  getPaymentById: (id) =>
    api.get(`/payment/${id}`).then((r) => r.data),

  // ================= DEALER ADMIN APPROVAL =================
  getDealerPending: () =>
    api.get("/payment/dealer/pending").then((r) => r.data),

  approveByDealer: (id, payload) =>
    api.post(`/payment/dealer/${id}/approve`, payload).then((r) => r.data),

  rejectByDealer: (id, payload) =>
    api.post(`/payment/dealer/${id}/reject`, payload).then((r) => r.data),

  // ================= FINANCE ADMIN APPROVAL =================
  getFinancePending: () =>
    api.get("/payment/pending").then((r) => r.data),

  approveByFinance: (id, payload) =>
    api.post(`/payment/${id}/approve`, payload).then((r) => r.data),

  rejectByFinance: (id, payload) =>
    api.post(`/payment/${id}/reject`, payload).then((r) => r.data),

  // ================== RECONCILIATION ==================
  getReconcileSummary: () =>
    api.get("/payment/reconcile").then((r) => r.data),

  triggerReconcile: () =>
    api.post("/payment/reconcile/trigger").then((r) => r.data),
};

// =======================================================================
// ======================== DOCUMENT MANAGEMENT APIs =====================
// =======================================================================

export const documentAPI = {
  // Upload document
  uploadDocument: (formData) =>
    api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Get documents
  getDocuments: (params) =>
    api.get("/documents", { params }).then((r) => r.data),

  // Get document by ID
  getDocumentById: (id) =>
    api.get(`/documents/${id}`).then((r) => r.data),

  // Download document
  downloadDocument: (id) =>
    api.get(`/documents/${id}/download`, { responseType: "blob" }).then((r) => r.data),

  // Get pending approvals
  getPendingApprovals: () =>
    api.get("/documents/pending-approvals").then((r) => r.data),

  // Approve/Reject document
  approveRejectDocument: (id, payload) =>
    api.post(`/documents/${id}/approve-reject`, payload).then((r) => r.data),

  // Update document status
  updateDocumentStatus: (id, status) =>
    api.post(`/documents/${id}/status`, { status }).then((r) => r.data),

  // Delete document
  deleteDocument: (id) =>
    api.delete(`/documents/${id}`).then((r) => r.data),
};

// =======================================================================
// ======================== PRICING APPROVAL APIs ========================
// =======================================================================

export const pricingAPI = {
  // Create pricing request
  createRequest: (payload) =>
    api.post("/pricing/request", payload).then((r) => r.data),

  // Get pricing requests
  getRequests: (params) =>
    api.get("/pricing/requests", { params }).then((r) => r.data),

  // Get pending approvals for current stage
  getPendingByStage: (stage) =>
    api.get(`/pricing/pending/${stage}`).then((r) => r.data),

  // Approve pricing request (multi-stage: Area → Regional → Super Admin)
  approve: (id, payload) =>
    api.post(`/pricing/${id}/approve`, payload).then((r) => r.data),

  // Reject pricing request
  reject: (id, payload) =>
    api.post(`/pricing/${id}/reject`, payload).then((r) => r.data),

  // Get pricing history
  getHistory: (params) =>
    api.get("/pricing/history", { params }).then((r) => r.data),
};

// =======================================================================
// ======================== INVOICE APIs =================================
// =======================================================================

export const invoiceAPI = {
  // Create invoice
  createInvoice: (payload) =>
    api.post("/invoices", payload).then((r) => r.data),

  // Get invoices (role-filtered)
  getInvoices: (params) =>
    api.get("/invoices", { params }).then((r) => r.data),

  // Get single invoice by id
  getInvoiceById: (id) =>
    api.get(`/invoices/${id}`).then((r) => r.data),

  // Update invoice
  updateInvoice: (id, payload) =>
    api.put(`/invoices/${id}`, payload).then((r) => r.data),

  // Download invoice PDF
  downloadInvoicePDF: (id) =>
    api.get(`/invoices/${id}/pdf`, { responseType: "arraybuffer" }).then((r) => r.data),

  // Get invoice summary
  getInvoiceSummary: (params) =>
    api.get("/invoices/summary", { params }).then((r) => r.data),
};

// =======================================================================
// ======================== MATERIAL MASTER APIs =========================
// =======================================================================

export const materialAPI = {
  // Get materials
  getMaterials: (params) =>
    api.get("/materials", { params }).then((r) => r.data),

  // Get material groups
  getMaterialGroups: () =>
    api.get("/material-groups").then((r) => r.data),

  // Get material by ID
  getMaterialById: (id) =>
    api.get(`/materials/${id}`).then((r) => r.data),

  // Create material
  createMaterial: (payload) =>
    api.post("/materials", payload).then((r) => r.data),

  // Update material
  updateMaterial: (id, payload) =>
    api.patch(`/materials/${id}`, payload).then((r) => r.data),

  // Delete material
  deleteMaterial: (id) =>
    api.delete(`/materials/${id}`).then((r) => r.data),

  // Bulk import from Excel
  bulkImport: (formData) =>
    api.post("/materials/bulk-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Download template
  downloadTemplate: () =>
    api.get("/materials/template", { responseType: "blob" }).then((r) => r.data),

  // Get material analytics
  getAnalytics: (params) =>
    api.get("/materials/analytics", { params }).then((r) => r.data),

  // Get material alerts
  getAlerts: () =>
    api.get("/materials/alerts").then((r) => r.data),
};

// =======================================================================
// ======================== GEOGRAPHIC MANAGEMENT APIs ===================
// =======================================================================

export const geoAPI = {
  // Regions
  getRegions: (params) =>
    api.get("/regions", { params }).then((r) => r.data),

  getRegionById: (id) =>
    api.get(`/regions/${id}`).then((r) => r.data),

  createRegion: (payload) =>
    api.post("/regions", payload).then((r) => r.data),

  updateRegion: (id, payload) =>
    api.put(`/regions/${id}`, payload).then((r) => r.data),

  deleteRegion: (id) =>
    api.delete(`/regions/${id}`).then((r) => r.data),

  // Areas
  getAreas: (params) =>
    api.get("/areas", { params }).then((r) => r.data),

  getAreaById: (id) =>
    api.get(`/areas/${id}`).then((r) => r.data),

  getAreasByRegion: (regionId) =>
    api.get(`/areas/region/${regionId}`).then((r) => r.data),

  createArea: (payload) =>
    api.post("/areas", payload).then((r) => r.data),

  updateArea: (id, payload) =>
    api.put(`/areas/${id}`, payload).then((r) => r.data),

  deleteArea: (id) =>
    api.delete(`/areas/${id}`).then((r) => r.data),

  // Territories
  getTerritories: (params) =>
    api.get("/territories", { params }).then((r) => r.data),

  getTerritoryById: (id) =>
    api.get(`/territories/${id}`).then((r) => r.data),

  getTerritoriesByArea: (areaId) =>
    api.get(`/areas/${areaId}/territories`).then((r) => r.data),

  createTerritory: (payload) =>
    api.post("/territories", payload).then((r) => r.data),

  updateTerritory: (id, payload) =>
    api.put(`/territories/${id}`, payload).then((r) => r.data),

  deleteTerritory: (id) =>
    api.delete(`/territories/${id}`).then((r) => r.data),

  // Map Data (GeoJSON)
  getMapData: (level, params) =>
    api.get(`/maps/${level}`, { params }).then((r) => r.data),

  // Sales heatmap data
  getHeatmapData: (params) =>
    api.get("/maps/heatmap", { params }).then((r) => r.data),

  // Dealer locations
  getDealerLocations: (params) =>
    api.get("/maps/dealers", { params }).then((r) => r.data),
};

// =======================================================================
// ======================== CHAT APIs ====================================
// =======================================================================

export const chatAPI = {
  // Get allowed users to chat with (hierarchical filtering)
  getAllowedUsers: () =>
    api.get("/chat/allowed-users").then((r) => r.data),

  // Get conversation with a partner
  getConversation: (partnerId, params) =>
    api.get(`/chat/conversation/${partnerId}`, { params }).then((r) => r.data),

  // Send message
  sendMessage: (payload) =>
    api.post("/chat/messages", payload).then((r) => r.data),

  // Mark conversation as read
  markRead: async (partnerId) => {
    const candidates = [
      { method: "patch", url: `/chat/${partnerId}/read` },
      { method: "post", url: `/chat/${partnerId}/read` },
      { method: "patch", url: `/chat/mark-read/${partnerId}` },
      { method: "post", url: `/chat/mark-read/${partnerId}` },
    ];

    let lastErr = null;
    for (const c of candidates) {
      try {
        const res = await api[c.method](c.url);
        return res.data;
      } catch (err) {
        lastErr = err;
        if (err.response && err.response.status === 404) continue;
      }
    }
    return Promise.reject(lastErr || new Error("Failed to mark chat read"));
  },

  // Get unread count
  getUnreadCount: () =>
    api.get("/chat/unread-count").then((r) => r.data),

  // Get recent conversations
  getRecentConversations: () =>
    api.get("/chat/conversations").then((r) => r.data),
};

// =======================================================================
// ======================== NOTIFICATION APIs ============================
// =======================================================================

export const notificationAPI = {
  // Get notifications
  getNotifications: (params) =>
    api.get("/notifications", { params }).then((r) => r.data),

  // Mark notification as read
  markNotificationRead: (id) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  // Mark all as read
  markAllRead: () =>
    api.patch("/notifications/mark-all-read").then((r) => r.data),

  // Get unread count
  getUnreadCount: () =>
    api.get("/notifications/unread-count").then((r) => r.data),

  // Delete notification
  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),
};

// =======================================================================
// ======================== CAMPAIGN MANAGEMENT APIs =====================
// =======================================================================

export const campaignAPI = {
  // Get campaigns (scoped by region)
  getCampaigns: (params) =>
    api.get("/campaigns", { params }).then((r) => r.data),

  // Get campaign by ID
  getCampaignById: (id) =>
    api.get(`/campaigns/${id}`).then((r) => r.data),

  // Create campaign
  createCampaign: (payload) =>
    api.post("/campaigns/create", payload).then((r) => r.data),

  // Update campaign
  updateCampaign: (id, payload) =>
    api.put(`/campaigns/${id}`, payload).then((r) => r.data),

  // Delete campaign
  deleteCampaign: (id) =>
    api.delete(`/campaigns/${id}`).then((r) => r.data),

  // Get campaign analytics
  getCampaignAnalytics: (id) =>
    api.get(`/campaigns/${id}/analytics`).then((r) => r.data),

  // Get targeted dealers
  getTargetedDealers: (id) =>
    api.get(`/campaigns/${id}/dealers`).then((r) => r.data),
};

// =======================================================================
// ======================== REPORTING & ANALYTICS APIs ===================
// =======================================================================

export const reportAPI = {
  // Dealer Performance Report
  getDealerPerformance: (params) =>
    api.get("/reports/dealer-performance", { params }).then((r) => r.data),

  // Territorial Summary Report
  getTerritorialSummary: (params) =>
    api.get("/reports/territorial-summary", { params }).then((r) => r.data),

  // Regional Sales Summary
  getRegionalSales: (params) =>
    api.get("/reports/regional-sales", { params }).then((r) => r.data),

  // Account Statement Report
  getAccountStatement: (params) =>
    api.get("/reports/account-statement", { params }).then((r) => r.data),

  // Invoice Register Report
  getInvoiceRegister: (params) =>
    api.get("/reports/invoice-register", { params }).then((r) => r.data),

  // Credit/Debit Notes Report
  getCreditDebitNotes: (params) =>
    api.get("/reports/credit-debit-notes", { params }).then((r) => r.data),

  // Outstanding Receivables Report
  getOutstandingReceivables: (params) =>
    api.get("/reports/outstanding-receivables", { params }).then((r) => r.data),

  // Pending Approvals Report
  getPendingApprovals: (params) =>
    api.get("/reports/pending-approvals", { params }).then((r) => r.data),

  // Admin Summary Report
  getAdminSummary: (params) =>
    api.get("/reports/admin-summary", { params }).then((r) => r.data),

  // Financial Dashboard Report
  getFinancialDashboard: (params) =>
    api.get("/reports/financial-dashboard", { params }).then((r) => r.data),

  // Export to PDF
  exportPDF: (reportType, params) =>
    api.post("/reports/export/pdf", { reportType, ...params }, {
      responseType: "blob"
    }).then((r) => r.data),

  // Export to Excel
  exportExcel: (reportType, params) =>
    api.post("/reports/export/excel", { reportType, ...params }, {
      responseType: "blob"
    }).then((r) => r.data),

  // Role-specific dashboard data
  getRoleDashboardData: (role) =>
    api.get(`/reports/${role}/dashboard-data`).then((r) => r.data),
};

// =======================================================================
// ======================== DEALER MANAGEMENT APIs =======================
// =======================================================================

export const dealerAPI = {
  // Get dealers (scoped by role)
  getDealers: (params) =>
    api.get("/dealers", { params }).then((r) => r.data),

  // Get dealer by ID
  getDealerById: (id) =>
    api.get(`/dealers/${id}`).then((r) => r.data),

  // Create dealer
  createDealer: (payload) =>
    api.post("/dealers", payload).then((r) => r.data),

  // Update dealer
  updateDealer: (id, payload) =>
    api.put(`/dealers/${id}`, payload).then((r) => r.data),

  // Approve dealer registration
  approveDealer: (id, payload) =>
    api.post(`/dealers/${id}/approve`, payload).then((r) => r.data),

  // Reject dealer registration
  rejectDealer: (id, payload) =>
    api.post(`/dealers/${id}/reject`, payload).then((r) => r.data),

  // Get dealer performance
  getDealerPerformance: (id, params) =>
    api.get(`/dealers/${id}/performance`, { params }).then((r) => r.data),

  // Get dealer hierarchy
  getDealerHierarchy: (id) =>
    api.get(`/dealers/${id}/hierarchy`).then((r) => r.data),
};

// Default export
export default api;
