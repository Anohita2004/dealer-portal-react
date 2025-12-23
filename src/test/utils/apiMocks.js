import { vi } from 'vitest';

/**
 * Comprehensive API mocks for all API modules
 * Use this in tests to ensure all API exports are available
 */
export const createApiMocks = () => ({
  // Core API instance
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
  
  // All API modules
  authAPI: {
    login: vi.fn(),
    verifyOTP: vi.fn(),
    resetPassword: vi.fn(),
    resetPasswordConfirm: vi.fn(),
    logout: vi.fn(),
  },
  
  dashboardAPI: {
    getDealerDashboard: vi.fn(() => Promise.resolve({})),
    getManagerDashboard: vi.fn(() => Promise.resolve({})),
    getRegionalDashboard: vi.fn(() => Promise.resolve({})),
    getSuperAdminDashboard: vi.fn(() => Promise.resolve({})),
  },
  
  userAPI: {
    getUsers: vi.fn(() => Promise.resolve({ users: [] })),
    getUserById: vi.fn(() => Promise.resolve({})),
    createUser: vi.fn(() => Promise.resolve({})),
    updateUser: vi.fn(() => Promise.resolve({})),
    deleteUser: vi.fn(() => Promise.resolve({})),
    activateUser: vi.fn(() => Promise.resolve({})),
    deactivateUser: vi.fn(() => Promise.resolve({})),
  },
  
  roleAPI: {
    getRoles: vi.fn(() => Promise.resolve([])),
    getRoleById: vi.fn(() => Promise.resolve({})),
  },
  
  workflowAPI: {
    getWorkflowStatus: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
  
  orderAPI: {
    createOrder: vi.fn(() => Promise.resolve({})),
    getMyOrders: vi.fn(() => Promise.resolve({ orders: [] })),
    getAllOrders: vi.fn(() => Promise.resolve({ orders: [] })),
    getOrderById: vi.fn(() => Promise.resolve({})),
    getPendingOrders: vi.fn(() => Promise.resolve({ orders: [] })),
    getPendingApprovals: vi.fn(() => Promise.resolve({ orders: [] })),
    approveOrder: vi.fn(() => Promise.resolve({})),
    rejectOrder: vi.fn(() => Promise.resolve({})),
    getWorkflowStatus: vi.fn(() => Promise.resolve({})),
  },
  
  paymentAPI: {
    createRequest: vi.fn(() => Promise.resolve({})),
    getMyRequests: vi.fn(() => Promise.resolve({ payments: [] })),
    getAllPayments: vi.fn(() => Promise.resolve({ payments: [] })),
    getPaymentById: vi.fn(() => Promise.resolve({})),
    getDealerPending: vi.fn(() => Promise.resolve({ pending: [] })),
    getFinancePending: vi.fn(() => Promise.resolve({ payments: [] })),
    approveByDealer: vi.fn(() => Promise.resolve({})),
    approveByFinance: vi.fn(() => Promise.resolve({})),
    triggerReconcile: vi.fn(() => Promise.resolve({})),
  },
  
  documentAPI: {
    getDocuments: vi.fn(() => Promise.resolve({ data: { documents: [] } })),
    uploadDocument: vi.fn(() => Promise.resolve({})),
    downloadDocument: vi.fn(() => Promise.resolve({})),
  },
  
  pricingAPI: {
    getPending: vi.fn(() => Promise.resolve({ data: { updates: [] } })),
    approvePricing: vi.fn(() => Promise.resolve({})),
  },
  
  invoiceAPI: {
    createInvoice: vi.fn(() => Promise.resolve({})),
    getInvoices: vi.fn(() => Promise.resolve({ invoices: [] })),
    getInvoiceById: vi.fn(() => Promise.resolve({})),
    getPendingApprovals: vi.fn(() => Promise.resolve({ invoices: [] })),
    approveInvoice: vi.fn(() => Promise.resolve({})),
    downloadInvoicePDF: vi.fn(() => Promise.resolve(new Blob())),
  },
  
  materialAPI: {
    getMaterials: vi.fn(() => Promise.resolve([])),
    getDealerMaterials: vi.fn(() => Promise.resolve([])),
    getMaterialById: vi.fn(() => Promise.resolve(null)),
  },
  
  geoAPI: {
    getRegions: vi.fn(() => Promise.resolve([])),
    getAreas: vi.fn(() => Promise.resolve([])),
    getTerritories: vi.fn(() => Promise.resolve([])),
  },
  
  chatAPI: {
    getMessages: vi.fn(() => Promise.resolve({ messages: [] })),
    sendMessage: vi.fn(() => Promise.resolve({})),
  },
  
  notificationAPI: {
    getNotifications: vi.fn(() => Promise.resolve({ notifications: [] })),
    markNotificationRead: vi.fn(() => Promise.resolve({})),
    markAllRead: vi.fn(() => Promise.resolve({})),
    deleteNotification: vi.fn(() => Promise.resolve({})),
  },
  
  campaignAPI: {
    getCampaigns: vi.fn(() => Promise.resolve({ campaigns: [] })),
    getActiveCampaigns: vi.fn(() => Promise.resolve({ data: [] })),
    createCampaign: vi.fn(() => Promise.resolve({})),
    updateCampaign: vi.fn(() => Promise.resolve({})),
    deleteCampaign: vi.fn(() => Promise.resolve({})),
  },
  
  reportAPI: {
    getRegionalSales: vi.fn(() => Promise.resolve({})),
    getDealerPerformance: vi.fn(() => Promise.resolve({})),
    getTerritoryReport: vi.fn(() => Promise.resolve({ data: [] })),
    getPendingApprovals: vi.fn(() => Promise.resolve({ items: [] })),
    getAdminSummary: vi.fn(() => Promise.resolve({ kpis: {}, charts: {} })),
  },
  
  dealerAPI: {
    getDealers: vi.fn(() => Promise.resolve([])),
    getDealerById: vi.fn(() => Promise.resolve({})),
    createDealer: vi.fn(() => Promise.resolve({})),
    updateDealer: vi.fn(() => Promise.resolve({})),
    getDealerStaff: vi.fn(() => Promise.resolve([])),
    createStaff: vi.fn(() => Promise.resolve({})),
    updateStaff: vi.fn(() => Promise.resolve({})),
    deleteStaff: vi.fn(() => Promise.resolve({})),
    getMyManager: vi.fn(() => Promise.resolve({})),
  },
  
  taskAPI: {
    getTasks: vi.fn(() => Promise.resolve({ tasks: [] })),
    completeTask: vi.fn(() => Promise.resolve({})),
  },
  
  featureToggleAPI: {
    getFeatures: vi.fn(() => Promise.resolve({ features: [] })),
  },
  
  teamAPI: {
    getTeams: vi.fn(() => Promise.resolve([])),
    createTeam: vi.fn(() => Promise.resolve({})),
  },
  
  inventoryAPI: {
    getSummary: vi.fn(() => Promise.resolve({ data: {} })),
  },
  
  adminAPI: {
    getStats: vi.fn(() => Promise.resolve({})),
  },
  
  managerAPI: {
    getDealers: vi.fn(() => Promise.resolve({ data: { dealers: [] } })),
    assignDealer: vi.fn(() => Promise.resolve({})),
  },

  // Geo API – extend with heatmapData for SuperAdminDashboard
  geoAPI: {
    getRegions: vi.fn(() => Promise.resolve([])),
    getAreas: vi.fn(() => Promise.resolve([])),
    getTerritories: vi.fn(() => Promise.resolve([])),
    getHeatmapData: vi.fn(() => Promise.resolve([])),
  },
});

