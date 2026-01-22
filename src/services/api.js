import axios from "axios";

// Safely access import.meta.env with fallback
const getApiUrl = () => {
  try {
    return import.meta?.env?.VITE_API_URL || "http://localhost:3000/api";
  } catch (e) {
    // Fallback for test environments where import.meta might not be available
    return "http://localhost:3000/api";
  }
};

const api = axios.create({
  baseURL: getApiUrl(),
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

    // Suppress console errors for expected 400/403/404 errors on optional endpoints
    // These are validation, permission-based, or optional features handled gracefully in components
    // Note: Browser Network tab will still show these requests (this is normal browser behavior)
    if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
      const optionalEndpoints = [
        "/chat/",
        "/notifications",
        "/campaigns/active",
        "/reports/dealer-performance",
        "/reports/dashboard/", // Dashboard endpoints may have validation errors
        "/inventory/summary",
        "/payments/due",
        "/users/me",
        "/auth/me",
        // Manager-specific helper endpoints are intentionally *not* called directly
        // from the UI anymore. They are kept here only for backward compatibility
        // with older builds that might still hit them.
        "/managers/approval-queue",
        "/managers/recent-activity",
        "/managers/dealers"
      ];
      const isOptional = optionalEndpoints.some((path) =>
        originalUrl.includes(path)
      );

      if (isOptional) {
        // Silently handle - these are expected validation/permission errors or optional endpoints
        // The error will still be available in catch blocks for handling
        // but we won't log it to console
        // Browser Network tab will still show these (cannot be suppressed)
        err.silent = true;
        // Prevent axios from logging to console by removing error message
        err.config = err.config || {};
        err.config._suppressErrorLog = true;
      }
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
  getSuperAdminDashboard: (params) =>
    api.get("/reports/dashboard/super", { params }).then((r) => r.data),

  // Regional Admin Dashboard
  getRegionalDashboard: (params) =>
    api.get("/reports/dashboard/regional", { params }).then((r) => r.data),

  // Manager Dashboard (Territory/Area/Regional Manager)
  getManagerDashboard: (params) =>
    api.get("/reports/dashboard/manager", { params }).then((r) => r.data),

  // Dealer Dashboard
  getDealerDashboard: (params) =>
    api.get("/reports/dashboard/dealer", { params }).then((r) => r.data),

  // Legacy endpoints (for backward compatibility)
  getSuperAdminKPI: () =>
    api.get("/admin/reports/kpi-summary").then((r) => r.data),

  getUserActivity: () =>
    api.get("/admin/reports/user-activity").then((r) => r.data),

  getRoleDistribution: () =>
    api.get("/admin/reports/role-distribution").then((r) => r.data),

  getMonthlyGrowth: (params) =>
    api.get("/admin/reports/monthly-growth", { params }).then((r) => r.data),

  // Technical Admin Dashboard
  getPermissionMatrix: () =>
    api.get("/technical-admin/permissions/matrix").then((r) => r.data),

  getSystemAuditLogs: (params) =>
    api.get("/technical-admin/audit-logs", { params }).then((r) => r.data),

  // Manager Dashboards (Regional/Area/Territory)
  getManagerSummary: (params) =>
    api.get("/managers/summary", { params }).then((r) => r.data),

  getManagerApprovalQueue: (params) =>
    // NOTE: Frontend must NOT call /managers/approval-queue directly.
    // Regional/Area/Territory managers see only role-scoped, workflow-based
    // pending items via the generic /orders endpoint with status filter.
    api
      .get("/orders", { params: { ...(params || {}), status: "pending" } })
      .then((r) => r.data),

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
  getAll: (params) =>
    api.get("/admin/users", { params }).then((r) => r.data),

  getUsers: (params) =>
    api.get("/admin/users", { params }).then((r) => r.data),

  getUserById: (id) =>
    api.get(`/admin/users/${id}`).then((r) => r.data),

  create: (payload) =>
    api.post("/admin/users", payload).then((r) => r.data),

  createUser: (payload) =>
    api.post("/admin/users", payload).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/admin/users/${id}`, payload).then((r) => r.data),

  updateUser: (id, payload) =>
    api.put(`/admin/users/${id}`, payload).then((r) => r.data),

  delete: (id) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  // Helper methods for dropdowns
  getRoles: () =>
    api.get("/roles").then((r) => r.data),

  getRegions: () =>
    api.get("/regions").then((r) => r.data),

  getAreas: (regionId) =>
    api.get("/areas", { params: { regionId } }).then((r) => r.data),

  getTerritories: (areaId) =>
    api.get("/territories", { params: { areaId } }).then((r) => r.data),

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
// ======================== WORKFLOW APIs ===============================
// =======================================================================

export const workflowAPI = {
  // Unified workflow endpoints
  getWorkflowStatus: (entityType, entityId) =>
    api.get(`/workflow/${entityType}/${entityId}/workflow`).then((r) => r.data),

  approveEntity: (entityType, entityId, remarks = "") =>
    api.patch(`/workflow/${entityType}/${entityId}/approve`, { remarks }).then((r) => r.data),

  rejectEntity: (entityType, entityId, reason, remarks = "") =>
    api.patch(`/workflow/${entityType}/${entityId}/reject`, { reason, remarks }).then((r) => r.data),
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

  // Unified pending orders endpoint for all approver roles
  // Backend endpoint: GET /api/orders/pending
  getPendingOrders: (params) =>
    api.get("/orders/pending", { params }).then((r) => r.data),

  // Get order by ID
  getOrderById: (id) =>
    api.get(`/orders/${id}`).then((r) => r.data),

  // Get pending approvals for current user's role
  // Note: Backend scopes orders automatically, so we get all orders and filter by status
  getPendingApprovals: (params) =>
    api.get("/orders", { params: { ...params, status: "pending" } }).then((r) => r.data),

  // Approve order (multi-stage: Territory → Area → Regional Manager)
  approveOrder: (id, payload) =>
    api.patch(`/orders/${id}/approve`, payload).then((r) => r.data),

  // Reject order
  rejectOrder: (id, payload) =>
    api.patch(`/orders/${id}/reject`, payload).then((r) => r.data),

  // Update order status
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  // Cancel order
  cancelOrder: (id, reason) =>
    api.post(`/orders/${id}/cancel`, { reason }).then((r) => r.data),

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/orders/${id}/workflow`).then((r) => r.data),
};

// =======================================================================
// ======================== PAYMENT WORKFLOW APIs ========================
// =======================================================================

export const paymentAPI = {
  // Dealer Staff: Create payment request
  createRequest: (formData) =>
    api.post("/payments/request", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Razorpay Gateway Initiation
  initiateGatewayPayment: (payload) =>
    api.post("/payments/gateway/init", payload).then((r) => r.data),

  // Razorpay Gateway Verification
  verifyGatewayPayment: (payload) =>
    api.post("/payments/gateway/verify", payload).then((r) => r.data),

  // Dealer: View own payment requests
  getMyRequests: (params) =>
    api.get("/payments/mine", { params }).then((r) => r.data),

  // DEPRECATED: Get all payments - endpoint /api/payments does not exist
  // Payments are workflow-driven and role-scoped. Use:
  // - getMyRequests() for dealer_staff/dealer_admin
  // - getDealerPending() for dealer_admin
  // - getFinancePending() for finance_admin/accounts_user
  // This function is kept for backward compatibility but will return 404
  getAllPayments: (params) =>
    api.get("/payments", { params }).then((r) => r.data).catch((err) => {
      // Return empty array for 404/403 to prevent crashes
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        return { data: [], payments: [] };
      }
      throw err;
    }),

  // Get payment by ID
  getPaymentById: (id) =>
    api.get(`/payments/${id}`).then((r) => r.data),

  // ================= DEALER ADMIN APPROVAL =================
  getDealerPending: (params) =>
    api.get("/payments/dealer/pending", { params }).then((r) => r.data),

  approveByDealer: (id, payload) =>
    api.post(`/payments/${id}/approve`, payload).then((r) => r.data),

  rejectByDealer: (id, payload) =>
    api.post(`/payments/${id}/reject`, payload).then((r) => r.data),

  // ================= FINANCE ADMIN APPROVAL =================
  getFinancePending: (params) =>
    api.get("/payments/pending", { params }).then((r) => r.data),

  approveByFinance: (id, payload) =>
    api.post(`/payments/${id}/approve`, payload).then((r) => r.data),

  // Reject by Finance
  rejectByFinance: (id, payload) =>
    api.post(`/payments/${id}/reject`, payload).then((r) => r.data),

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/payments/${id}/workflow`).then((r) => r.data),

  // ================== RECONCILIATION ==================
  getReconcileSummary: () =>
    api.get("/payments/reconcile").then((r) => r.data),

  triggerReconcile: () =>
    api.post("/payments/reconcile/trigger").then((r) => r.data),

  // ================== BULK ACTIONS ==================
  bulkApprove: (paymentIds, remarks) =>
    api.post("/payments/bulk/approve", { paymentIds, remarks }).then((r) => r.data),

  bulkReject: (paymentIds, reason, remarks) =>
    api.post("/payments/bulk/reject", { paymentIds, reason, remarks }).then((r) => r.data),
};

// =======================================================================
// ======================== DOCUMENT MANAGEMENT APIs =====================
// =======================================================================

export const documentAPI = {
  // Upload document
  uploadDocument: (formData) =>
    api.post("/documents", formData, {
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

  // Get manager documents
  getManagerDocuments: () =>
    api.get("/documents/manager").then((r) => r.data),

  // Approve/Reject document
  approveRejectDocument: (id, payload) =>
    api.patch(`/documents/${id}/status`, payload).then((r) => r.data),

  // Delete document
  deleteDocument: (id) =>
    api.delete(`/documents/${id}`).then((r) => r.data),

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/documents/${id}/workflow`).then((r) => r.data),
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
    api.get("/pricing", { params }).then((r) => r.data),

  // Get pending approvals for current stage
  getPending: () =>
    api.get("/pricing/pending").then((r) => r.data),

  // Get manager pricing requests
  getManagerRequests: () =>
    api.get("/pricing/manager").then((r) => r.data),

  // Approve pricing request (multi-stage: Area → Regional Admin → Super Admin)
  approve: (id, payload) =>
    api.patch(`/pricing/${id}`, payload).then((r) => r.data),

  // Reject pricing request
  reject: (id, payload) =>
    api.patch(`/pricing/${id}`, { ...payload, action: "reject" }).then((r) => r.data),

  // Get pricing history
  getHistory: (params) =>
    api.get("/pricing", { params }).then((r) => r.data),

  // Get pricing summary (super_admin)
  getSummary: () =>
    api.get("/pricing/summary").then((r) => r.data),

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/pricing/${id}/workflow`).then((r) => r.data),
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

  // Get pending approvals
  getPendingApprovals: (params) =>
    api.get("/invoices/pending/approvals", { params }).then((r) => r.data),

  // Approve/reject invoice
  approveInvoice: (id, payload) =>
    api.post(`/invoices/${id}/approve`, payload).then((r) => r.data),

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/invoices/${id}/workflow`).then((r) => r.data),

  // ================== BULK ACTIONS ==================
  bulkApprove: (invoiceIds, notes) =>
    api.post("/invoices/bulk/approve", { invoiceIds, notes }).then((r) => r.data),

  bulkReject: (invoiceIds, reason, remarks) =>
    api.post("/invoices/bulk/reject", { invoiceIds, reason, remarks }).then((r) => r.data),
};

// =======================================================================
// ======================== MATERIAL MASTER APIs =========================
// =======================================================================

export const materialAPI = {
  // Get materials
  getMaterials: (params) =>
    api.get("/materials", { params }).then((r) => r.data),

  // Get materials mapped to a specific dealer (for sales_executive, etc.)
  getDealerMaterials: (dealerId) =>
    api.get(`/materials/dealer/${dealerId}`).then((r) => r.data),

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

  // ================== REGION / DEALER MATERIAL MAPPINGS ==================

  // Get materials mapped to a specific region (admin-only)
  getRegionMaterials: (regionId) =>
    api.get(`/regions/${regionId}/materials`).then((r) => r.data),

  // Assign materials to region
  assignRegionMaterials: (regionId, materialIds) =>
    api
      .post(`/regions/${regionId}/materials`, { materialIds })
      .then((r) => r.data),

  // Unassign single material from region
  unassignRegionMaterial: (regionId, materialId) =>
    api
      .delete(`/regions/${regionId}/materials/${materialId}`)
      .then((r) => r.data),

  // Get materials mapped to a specific dealer (admin view of mappings)
  getDealerMaterialAssignments: (dealerId) =>
    api.get(`/dealers/${dealerId}/materials`).then((r) => r.data),

  // Assign materials to dealer
  assignDealerMaterials: (dealerId, materialIds) =>
    api
      .post(`/dealers/${dealerId}/materials`, { materialIds })
      .then((r) => r.data),

  // Unassign single material from dealer
  unassignDealerMaterial: (dealerId, materialId) =>
    api
      .delete(`/dealers/${dealerId}/materials/${materialId}`)
      .then((r) => r.data),
};

// =======================================================================
// ======================== GEOGRAPHY APIs ==============================
// =======================================================================

export const geoAPI = {
  // Regions
  getRegions: (params) =>
    // List regions
    api.get("/regions", { params }).then((r) => r.data),

  getRegionById: (id) =>
    api.get(`/regions/${id}`).then((r) => r.data),

  createRegion: (payload) =>
    api.post("/regions", payload).then((r) => r.data),

  updateRegion: (id, payload) =>
    api.put(`/regions/${id}`, payload).then((r) => r.data),

  deleteRegion: (id) =>
    api.delete(`/regions/${id}`).then((r) => r.data),

  // Regional Dashboard Endpoints
  getRegionalDashboardSummary: (params) =>
    api.get("/regions/dashboard/summary", { params }).then((r) => r.data),

  getRegionalAreas: (params) =>
    api.get("/regions/dashboard/areas", { params }).then((r) => r.data),

  getRegionalApprovals: (params) =>
    api.get("/regions/dashboard/approvals", { params }).then((r) => r.data),

  // Areas
  getAreas: (params) =>
    api.get("/areas", { params }).then((r) => r.data),

  getAreaById: (id) =>
    api.get(`/areas/${id}`).then((r) => r.data),

  getAreasByRegion: (regionId) =>
    api.get(`/areas`, { params: { regionId } }).then((r) => r.data),

  createArea: (payload) =>
    api.post("/areas", payload).then((r) => r.data),

  updateArea: (id, payload) =>
    api.put(`/areas/${id}`, payload).then((r) => r.data),

  deleteArea: (id) =>
    api.delete(`/areas/${id}`).then((r) => r.data),

  // Area Dashboard Endpoints
  getAreaDashboardSummary: (params) =>
    api.get("/areas/dashboard/summary", { params }).then((r) => r.data),

  getAreaDealers: (params) =>
    api.get("/areas/dashboard/dealers", { params }).then((r) => r.data),

  getAreaApprovals: (params) =>
    api.get("/areas/dashboard/approvals", { params }).then((r) => r.data),

  // Territories
  getTerritories: (params) =>
    api.get("/territories", { params }).then((r) => r.data),

  getTerritoryById: (id) =>
    api.get(`/territories/${id}`).then((r) => r.data),

  getTerritoriesByArea: (areaId) =>
    api.get(`/territories`, { params: { areaId } }).then((r) => r.data),

  createTerritory: (payload) =>
    api.post("/territories", payload).then((r) => r.data),

  updateTerritory: (id, payload) =>
    api.put(`/territories/${id}`, payload).then((r) => r.data),

  deleteTerritory: (id) =>
    api.delete(`/territories/${id}`).then((r) => r.data),

  // Map Data (GeoJSON)
  getRegionsGeoJSON: () =>
    api.get("/maps/regions").then((r) => r.data),

  getTerritoriesGeoJSON: (params) =>
    api.get("/maps/territories", { params }).then((r) => r.data),

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

  // Send message (updated to match guide: POST /api/chat/send)
  sendMessage: (payload) =>
    api.post("/chat/send", payload).then((r) => r.data),

  // Mark conversation as read (updated to match guide: PATCH /api/chat/:partnerId/read)
  markRead: async (partnerId) => {
    try {
      const res = await api.patch(`/chat/${partnerId}/read`);
      return res.data;
    } catch (err) {
      // Fallback to POST if PATCH doesn't work
      try {
        const res = await api.post(`/chat/${partnerId}/read`);
        return res.data;
      } catch (fallbackErr) {
        throw fallbackErr || err;
      }
    }
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
  // Get campaigns (scoped by targetAudience)
  getCampaigns: (params) =>
    api.get("/campaigns", { params }).then((r) => r.data),

  // Get active campaigns
  getActiveCampaigns: () =>
    api.get("/campaigns/active").then((r) => r.data),

  // Get campaign by ID
  getCampaignById: (id) =>
    api.get(`/campaigns/${id}`).then((r) => r.data),

  // Create campaign
  createCampaign: (payload) =>
    api.post("/campaigns", payload).then((r) => r.data),

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

  // Get workflow status
  getWorkflowStatus: (id) =>
    api.get(`/campaigns/${id}/workflow`).then((r) => r.data),
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
    api.get("/reports/regional-sales-summary", { params }).then((r) => r.data),

  // Territory Report
  getTerritoryReport: (params) =>
    api.get("/reports/territory", { params }).then((r) => r.data),

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

  // Financial Reports
  getLERegister: (params) => api.get("/reports/finance/le-register", { params }).then((r) => r.data),
  getFIDaywise: (params) => api.get("/reports/finance/fi-daywise", { params }).then((r) => r.data),
  getDRCRNoteRegister: (params) => api.get("/reports/finance/drcr-note", { params }).then((r) => r.data),
  getSalesRegister: (params) => api.get("/reports/finance/sales-register", { params }).then((r) => r.data),
  getCollectionReport: (params) => api.get("/reports/finance/collection", { params }).then((r) => r.data),

  // Inventory & Stock Reports
  getStockOverview: (params) => api.get("/reports/inventory/stock-overview", { params }).then((r) => r.data),
  getComparativeReport: (params) => api.get("/reports/inventory/comparative", { params }).then((r) => r.data),
  getComplianceReport: (params) => api.get("/reports/inventory/compliance", { params }).then((r) => r.data),
  getRRSummary: (params) => api.get("/reports/inventory/rr-summary", { params }).then((r) => r.data),

  // Rake & Logistics Reports
  getRakeArrivalReport: (params) => api.get("/reports/rake/arrival", { params }).then((r) => r.data),
  getRakeArrivalData: (params) => api.get("/reports/rake/data", { params }).then((r) => r.data),
  getConsolidatedException: (params) => api.get("/reports/rake/exception", { params }).then((r) => r.data),
  getRakeApproval: (params) => api.get("/reports/rake/approval", { params }).then((r) => r.data),

  // Technical & Data Management
  getDiversionReport: (params) => api.get("/reports/diversion", { params }).then((r) => r.data),
  getDMSOrderRequests: (params) => api.get("/reports/dms-requests", { params }).then((r) => r.data),

  // Role-specific dashboard data
  getRoleDashboardData: (role) =>
    api.get(`/reports/${role}/dashboard-data`).then((r) => r.data),
};

// =======================================================================
// ======================== DEALER MANAGEMENT APIs =======================
// =======================================================================

export const dealerAPI = {
  // Get dealer staff
  getDealerStaff: () =>
    api.get("/dealers/staff").then((r) => r.data),

  // Create staff member
  createStaff: (payload) =>
    api.post("/dealers/staff", payload).then((r) => r.data),

  // Update staff member
  updateStaff: (id, payload) =>
    api.put(`/dealers/staff/${id}`, payload).then((r) => r.data),

  // Delete staff member
  deleteStaff: (id) =>
    api.delete(`/dealers/staff/${id}`).then((r) => r.data),
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

  // Dealer self profile (for dealer_admin / dealer_staff)
  getMyDealerProfile: () =>
    api.get("/dealers/profile").then((r) => r.data),

  // Dealer → My Manager (for dealer_admin / dealer_staff)
  getMyManager: () =>
    api.get("/dealers/my-manager").then((r) => r.data),

  // Block / Unblock dealer (super_admin / key_user)
  blockDealer: (id, isBlocked, reason) =>
    api.put(`/dealers/${id}/block`, { isBlocked, reason }).then((r) => r.data),

  // Verify dealer (super_admin / key_user)
  verifyDealer: (id, payload = {}) =>
    api.put(`/dealers/${id}/verify`, payload).then((r) => r.data),
};

// =======================================================================
// ======================== TASKS APIs ===================================
// =======================================================================

export const taskAPI = {
  // Get pending tasks for current user
  getTasks: () =>
    api.get("/tasks").then((r) => r.data),
};

// =======================================================================
// ======================== FEATURE TOGGLES APIs =========================
// =======================================================================

export const featureToggleAPI = {
  // Get all feature toggles
  getFeatureToggles: () =>
    api.get("/feature-toggles").then((r) => r.data),

  // Get single feature toggle
  getFeatureToggle: (key) =>
    api.get(`/feature-toggles/${key}`).then((r) => r.data),

  // Create/update feature toggle
  updateFeatureToggle: (payload) =>
    api.post("/feature-toggles", payload).then((r) => r.data),

  // Update feature toggle
  putFeatureToggle: (key, payload) =>
    api.put(`/feature-toggles/${key}`, payload).then((r) => r.data),
};

// =======================================================================
// ======================== TEAMS APIs ==================================
// =======================================================================

export const teamAPI = {
  // Get teams
  getTeams: () =>
    api.get("/teams").then((r) => r.data),

  // Get team by ID
  getTeamById: (id) =>
    api.get(`/teams/${id}`).then((r) => r.data),

  // Get team performance (sales, orders, payments, invoices)
  getTeamPerformance: (id) =>
    api.get(`/teams/${id}/performance`).then((r) => r.data),

  // Create team
  createTeam: (payload) =>
    api.post("/teams", payload).then((r) => r.data),

  // Update team
  updateTeam: (id, payload) =>
    api.put(`/teams/${id}`, payload).then((r) => r.data),

  // Delete team
  deleteTeam: (id) =>
    api.delete(`/teams/${id}`).then((r) => r.data),

  // Add dealer to team
  addDealerToTeam: (teamId, dealerId) =>
    api.post(`/teams/${teamId}/dealers`, { dealerId }).then((r) => r.data),

  // Remove dealer from team
  removeDealerFromTeam: (teamId, dealerId) =>
    api.delete(`/teams/${teamId}/dealers/${dealerId}`).then((r) => r.data),

  // Add manager to team
  addManagerToTeam: (teamId, managerId) =>
    api.post(`/teams/${teamId}/managers`, { managerId }).then((r) => r.data),

  // Remove manager from team
  removeManagerFromTeam: (teamId, managerId) =>
    api.delete(`/teams/${teamId}/managers/${managerId}`).then((r) => r.data),
};

// =======================================================================
// ======================== INVENTORY APIs ==============================
// =======================================================================

export const inventoryAPI = {
  // Get inventory summary (scoped)
  getSummary: () =>
    api.get("/inventory/summary").then((r) => r.data),

  // Get inventory details
  getDetails: (params) =>
    api.get("/inventory/details", { params }).then((r) => r.data),

  // Create inventory item
  createItem: (payload) =>
    api.post("/inventory", payload).then((r) => r.data),

  // Update inventory item
  updateItem: (id, payload) =>
    api.put(`/inventory/${id}`, payload).then((r) => r.data),

  // Delete inventory item
  deleteItem: (id) =>
    api.delete(`/inventory/${id}`).then((r) => r.data),

  // Adjust stock level
  adjustStock: (id, adjustment, reason) =>
    api.patch(`/inventory/${id}/adjust`, { adjustment, reason }).then((r) => r.data),

  // Get low stock alerts
  getLowStockAlerts: () =>
    api.get("/inventory/alerts/low-stock").then((r) => r.data),

  // Get inventory by plant
  getByPlant: (plantCode) =>
    api.get(`/inventory/plant/${plantCode}`).then((r) => r.data),

  // Export inventory
  exportInventory: (format) =>
    api.get(`/inventory/export?format=${format}`, { responseType: "blob" }).then((r) => r.data),
};

// =======================================================================
// ======================== ADMIN APIs ==================================
// =======================================================================

export const adminAPI = {
  // Run SLA check
  runSLACheck: () =>
    api.post("/admin/sla/run").then((r) => r.data),

  // Block dealer
  blockDealer: (id) =>
    api.put(`/admin/dealers/${id}/block`).then((r) => r.data),

  // Verify dealer
  verifyDealer: (id) =>
    api.put(`/admin/dealers/${id}/verify`).then((r) => r.data),

  // Assign region to dealer
  assignRegion: (id, regionId) =>
    api.put(`/admin/dealers/${id}/assign-region`, { regionId }).then((r) => r.data),

  // Merge sales groups
  mergeSalesGroups: (payload) =>
    api.post("/admin/sales-groups/merge", payload).then((r) => r.data),

  // Review document
  reviewDocument: (id, payload) =>
    api.put(`/admin/documents/${id}/review`, payload).then((r) => r.data),

  // Review pricing
  reviewPricing: (id, payload) =>
    api.patch(`/admin/pricing-updates/${id}/review`, payload).then((r) => r.data),

  // Get admin reports
  getAdminReports: (params) =>
    api.get("/admin/reports", { params }).then((r) => r.data),
};

// =======================================================================
// ======================== MANAGER APIs =================================
// =======================================================================

export const managerAPI = {
  // Get manager summary
  getSummary: () =>
    api.get("/managers/summary").then((r) => r.data),

  // Get assigned dealers (scoped by manager's territory/area/region)
  // NOTE: Do NOT call /managers/dealers. Backend exposes scoped dealers
  // via the generic /dealers endpoint, which enforces hierarchical RBAC
  // and territory/dealer scoping for the current user.
  getDealers: (params) =>
    api.get("/dealers", { params }).then((r) => r.data),

  // Get dealer by ID (scoped)
  getDealer: (id) =>
    api.get(`/dealers/${id}`).then((r) => r.data),

  // Get pricing requests from dealers under manager
  getPricing: (params) =>
    api.get("/managers/pricing", { params }).then((r) => r.data),

  // Forward pricing request
  forwardPricing: (id, payload) =>
    api.patch(`/managers/pricing/${id}/forward`, payload).then((r) => r.data),

  // Assign dealer to manager (super_admin, key_user only)
  assignDealer: (payload) =>
    api.post("/managers/assign-dealer", payload).then((r) => r.data),
};

// =======================================================================
// ======================== FLEET MANAGEMENT APIs ======================
// =======================================================================

export const warehouseAPI = {
  // Get all warehouses
  getAll: (params) =>
    api.get("/warehouses", { params }).then((r) => r.data),

  // Get warehouse by ID
  getById: (id) =>
    api.get(`/warehouses/${id}`).then((r) => r.data),

  // Get nearest warehouse
  getNearest: (params) =>
    api.get("/warehouses/nearest", { params }).then((r) => r.data),

  // Create warehouse
  create: (payload) =>
    api.post("/warehouses", payload).then((r) => r.data),

  // Update warehouse
  update: (id, payload) =>
    api.put(`/warehouses/${id}`, payload).then((r) => r.data),

  // Delete warehouse (soft delete)
  delete: (id) =>
    api.delete(`/warehouses/${id}`).then((r) => r.data),
};

export const truckAPI = {
  // Get all trucks
  getAll: (params) =>
    api.get("/trucks", { params }).then((r) => r.data),

  // Get truck by ID
  getById: (id) =>
    api.get(`/trucks/${id}`).then((r) => r.data),

  // Create truck
  create: (payload) =>
    api.post("/trucks", payload).then((r) => r.data),

  // Update truck
  update: (id, payload) =>
    api.put(`/trucks/${id}`, payload).then((r) => r.data),

  // Delete truck (soft delete)
  delete: (id) =>
    api.delete(`/trucks/${id}`).then((r) => r.data),

  // Get truck location
  getLocation: (id) =>
    api.get(`/trucks/${id}/location`).then((r) => r.data),

  // Get truck location history
  getLocationHistory: (id, params) =>
    api.get(`/trucks/${id}/history`, { params }).then((r) => r.data),
};

export const fleetAPI = {
  // Assign truck to order
  assign: (payload) =>
    api.post("/fleet/assign", payload).then((r) => r.data),

  // Get all assignments
  getAssignments: (params) =>
    api.get("/fleet/assignments", { params }).then((r) => r.data),

  // Get assignment by ID
  getAssignment: (id) =>
    api.get(`/fleet/assignments/${id}`).then((r) => r.data),

  // Update assignment
  updateAssignment: (id, payload) =>
    api.put(`/fleet/assignments/${id}`, payload).then((r) => r.data),

  // Mark pickup
  markPickup: (id) =>
    api.post(`/fleet/assignments/${id}/pickup`).then((r) => r.data),

  // Mark delivered
  markDeliver: (id) =>
    api.post(`/fleet/assignments/${id}/deliver`).then((r) => r.data),

  // Update assignment status
  updateStatus: (id, payload) =>
    api.patch(`/fleet/assignments/${id}/status`, payload).then((r) => r.data),
};

export const trackingAPI = {
  // Start GPS tracking from driver's current location
  startTracking: (payload) =>
    api.post("/tracking/start", payload).then((r) => r.data),

  // Update truck location (mobile app)
  updateLocation: (payload) =>
    api.post("/tracking/location", payload).then((r) => r.data),

  // Get live truck locations (optionally filtered by dealerId)
  getLiveLocations: (params) =>
    api.get("/tracking/live", { params }).then((r) => r.data),

  // Get order tracking
  getOrderTracking: (orderId) =>
    api.get(`/tracking/order/${orderId}`).then((r) => r.data),

  // Get current ETA for assignment
  getAssignmentEta: (assignmentId) =>
    api.get(`/tracking/assignment/${assignmentId}/eta`).then((r) => r.data),

  // Get truck location history
  getTruckHistory: (truckId, params) =>
    api.get(`/tracking/truck/${truckId}/history`, { params }).then((r) => r.data),
};

export const barcodeAPI = {
  scan: (barcode) =>
    api.post("/barcodes/scan", { barcode }).then((r) => r.data),

  getHistory: (params) =>
    api.get("/barcodes/history", { params }).then((r) => r.data),
};

export const goodsReceiptAPI = {
  getPending: (params) =>
    api.get("/goods-receipt/pending", { params }).then((r) => r.data),

  getById: (id) =>
    api.get(`/goods-receipt/${id}`).then((r) => r.data),

  postReceipt: (payload) =>
    api.post("/goods-receipt/post", payload).then((r) => r.data),

  getSummary: () =>
    api.get("/goods-receipt/summary").then((r) => r.data),

  approve: (id) =>
    api.post(`/goods-receipt/${id}/approve`).then((r) => r.data),

  reject: (id, remarks) =>
    api.post(`/goods-receipt/${id}/reject`, { remarks }).then((r) => r.data),
};

// Default export
export default api;
