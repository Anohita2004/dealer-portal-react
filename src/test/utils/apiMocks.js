import { vi } from 'vitest';

/**
 * Comprehensive API mocks for all API modules
 * Use this in tests to ensure all API exports are available
 */
export const createApiMocks = () => ({
  // Core API instance
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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
    getDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    downloadDocument: vi.fn(),
  },
  
  pricingAPI: {
    getPending: vi.fn(),
    approvePricing: vi.fn(),
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
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
  
  notificationAPI: {
    getNotifications: vi.fn(() => Promise.resolve({ notifications: [] })),
    markNotificationRead: vi.fn(() => Promise.resolve({})),
    markAllRead: vi.fn(() => Promise.resolve({})),
    deleteNotification: vi.fn(() => Promise.resolve({})),
  },
  
  campaignAPI: {
    getCampaigns: vi.fn(),
    getActiveCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
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
    getFeatures: vi.fn(),
  },
  
  teamAPI: {
    getTeams: vi.fn(),
    createTeam: vi.fn(),
  },
  
  inventoryAPI: {
    getSummary: vi.fn(),
  },
  
  adminAPI: {
    getStats: vi.fn(),
  },
  
  managerAPI: {
    getDealers: vi.fn(),
    assignDealer: vi.fn(),
  },
});

