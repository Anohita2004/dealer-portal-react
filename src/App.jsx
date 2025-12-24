import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// 🔐 Auth
import ProtectedRoute, { RoleRedirect } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoadingFallback from "./components/LoadingFallback";
import PageTransition from "./components/PageTransition";

// 🔑 Public
import Login from "./pages/Login";

// 🧭 Dashboards
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const SuperAdminDashboard = React.lazy(() => import("./pages/dashboards/SuperAdminDashboard"));
const RegionalAdminDashboard = React.lazy(() => import("./pages/dashboards/RegionalAdminDashboard"));
const ManagerDashboard = React.lazy(() => import("./pages/dashboards/ManagerDashboard"));
const RegionalManagerDashboard = React.lazy(() => import("./pages/dashboards/RegionalManagerDashboard"));
const AreaManagerDashboard = React.lazy(() => import("./pages/dashboards/AreaManagerDashboard"));
const TerritoryManagerDashboard = React.lazy(() => import("./pages/dashboards/TerritoryManagerDashboard"));
const DealerDashboard = React.lazy(() => import("./pages/dashboards/DealerDashboard"));
const InventoryDashboard = React.lazy(() => import("./pages/dashboards/InventoryDashboard"));
const AccountsDashboard = React.lazy(() => import("./pages/dashboards/AccountsDashboard"));

// 📄 Common Pages
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/documents/DocumentDetail";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/campaigns/CampaignDetail";
import Reports from "./pages/Reports";
import CreatePaymentRequest from "./pages/payments/CreatePaymentRequest";
import PaymentDetail from "./pages/payments/PaymentDetail";
import DealerAdminPayments from "./pages/payments/DealerAdminPayments";
import FinancePendingPayments from "./pages/payments/FinancePendingPayments";
import SuperAdminUsers from "./pages/superadmin/Users";
import SuperAdminRoles from "./pages/superadmin/Roles";
import SuperAdminTeamManagement from "./pages/superadmin/TeamManagement";
import UserFormPage from "./pages/superadmin/UserFormPage"; // if using it
import DealerFormPage from "./pages/superadmin/DealerFormPage";


// 🛠 Admin & Config
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminDocuments = React.lazy(() => import("./pages/AdminDocuments"));
const PricingApprovals = React.lazy(() => import("./pages/PricingApprovals"));
const PricingRequestDetail = React.lazy(() => import("./pages/pricing/PricingRequestDetail"));

// 💼 Accounts subpages
const AccountsInvoices = React.lazy(() => import("./pages/accounts/AccountsInvoices"));
const AccountsNotes = React.lazy(() => import("./pages/accounts/AccountsNotes"));
const AccountsReports = React.lazy(() => import("./pages/accounts/AccountsReports"));

// 💬 Chat
const ManagerChat = React.lazy(() => import("./pages/ManagerChat"));
const DealerChat = React.lazy(() => import("./pages/DealerChat"));

// 🆕 Super Admin CRUD pages (you will build these)
const Users = React.lazy(() => import("./pages/superadmin/Users"));
const Roles = React.lazy(() => import("./pages/superadmin/Roles"));
const TechnicalAdmin = React.lazy(() => import("./pages/technicaladmin/TechnicalAdmin"));
const AdminOrders = React.lazy(() => import("./pages/orders/AdminOrders"));
const CreateOrder = React.lazy(() => import("./pages/orders/CreateOrders"));
const MyOrders = React.lazy(() => import("./pages/orders/MyOrders"));
const OrderDetail = React.lazy(() => import("./pages/orders/OrderDetail"));
const Materials = React.lazy(() => import("./pages/Materials"));
const ChatUI = React.lazy(() => import("./pages/ChatUI"));
const MaterialImport = React.lazy(() => import("./pages/Materials/MaterialImport"));
const MaterialAnalytics = React.lazy(() => import("./pages/Materials/MaterialAnalytics"));
const MaterialAlerts = React.lazy(() => import("./pages/Alerts/MaterialAlerts"));
const RegionMaterialAvailability = React.lazy(() => import("./pages/Materials/RegionMaterialAvailability"));
const DealerMaterialAssignment = React.lazy(() => import("./pages/Materials/DealerMaterialAssignment"));

const RegionMap = React.lazy(() => import("./pages/maps/RegionMaps"));
const FeatureToggles = React.lazy(() => import("./pages/superadmin/FeatureToggles"));
const SystemAdmin = React.lazy(() => import("./pages/superadmin/SystemAdmin"));
const SuperAdminReports = React.lazy(() => import("./pages/superadmin/SuperAdminReports"));
const Unauthorized = React.lazy(() => import("./pages/Unauthorized"));
const StaffManagement = React.lazy(() => import("./pages/StaffManagement"));
const DealerManagement = React.lazy(() => import("./pages/DealerManagement"));
const Approvals = React.lazy(() => import("./pages/Approvals"));
const AllOrders = React.lazy(() => import("./pages/superadmin/AllOrders"));
const AllInvoices = React.lazy(() => import("./pages/superadmin/AllInvoices"));
const AllPayments = React.lazy(() => import("./pages/superadmin/AllPayments"));
const AllDealers = React.lazy(() => import("./pages/superadmin/AllDealers"));
const UserActivity = React.lazy(() => import("./pages/superadmin/UserActivity"));
const TeamPerformance = React.lazy(() => import("./pages/superadmin/TeamPerformance"));
const RegionWiseReports = React.lazy(() => import("./pages/superadmin/RegionWiseReports"));
const DealerProfile = React.lazy(() => import("./pages/DealerProfile"));
const DealerDetail = React.lazy(() => import("./pages/DealerDetail"));

const MyPaymentRequests = React.lazy(() => import("./pages/payments/MyPaymentRequest"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const Notifications = React.lazy(() => import("./pages/Notifications"));

// Regional Admin Pages
const RegionalUserManagement = React.lazy(() => import("./pages/regional/RegionalUserManagement"));
const RegionalReports = React.lazy(() => import("./pages/regional/RegionalReports"));
const RegionalApprovals = React.lazy(() => import("./pages/regional/RegionalApprovals"));
const RegionalHeatmap = React.lazy(() => import("./pages/regional/RegionalHeatmap"));
const RegionalManagers = React.lazy(() => import("./pages/regional/RegionalManagers"));
const RegionalOrders = React.lazy(() => import("./pages/regional/RegionalOrders"));
const RegionalInvoices = React.lazy(() => import("./pages/regional/RegionalInvoices"));
const RegionalPayments = React.lazy(() => import("./pages/regional/RegionalPayments"));
const RegionalDocuments = React.lazy(() => import("./pages/regional/RegionalDocuments"));
const RegionalPricing = React.lazy(() => import("./pages/regional/RegionalPricing"));
const CampaignApprovals = React.lazy(() => import("./pages/regional/CampaignApprovals"));
const RegionalCampaigns = React.lazy(() => import("./pages/regional/RegionalCampaigns"));
const CampaignAnalytics = React.lazy(() => import("./pages/regional/CampaignAnalytics"));
const TerritoryPerformance = React.lazy(() => import("./pages/regional/TerritoryPerformance"));
const DealerPerformance = React.lazy(() => import("./pages/regional/DealerPerformance"));
const OutstandingPayments = React.lazy(() => import("./pages/regional/OutstandingPayments"));
const RegionalInventory = React.lazy(() => import("./pages/regional/RegionalInventory"));
const StockAlerts = React.lazy(() => import("./pages/regional/StockAlerts"));
const MaterialSummary = React.lazy(() => import("./pages/regional/MaterialSummary"));

// Area Manager Pages
const AreaHeatmap = React.lazy(() => import("./pages/area/AreaHeatmap"));
const AreaDealers = React.lazy(() => import("./pages/area/AreaDealers"));
const AreaStaff = React.lazy(() => import("./pages/area/AreaStaff"));
const AreaApprovals = React.lazy(() => import("./pages/area/AreaApprovals"));
const AreaOrders = React.lazy(() => import("./pages/area/AreaOrders"));
const AreaDocuments = React.lazy(() => import("./pages/area/AreaDocuments"));
const AreaPayments = React.lazy(() => import("./pages/area/AreaPayments"));
const AreaPricing = React.lazy(() => import("./pages/area/AreaPricing"));
const AreaSales = React.lazy(() => import("./pages/area/AreaSales"));
const AreaOutstanding = React.lazy(() => import("./pages/area/AreaOutstanding"));
const AreaDealerPerformance = React.lazy(() => import("./pages/area/AreaDealerPerformance"));
const AreaCampaigns = React.lazy(() => import("./pages/area/AreaCampaigns"));
const AreaInventory = React.lazy(() => import("./pages/area/AreaInventory"));

// Territory Manager Pages
const TerritoryDealers = React.lazy(() => import("./pages/territory/TerritoryDealers"));
const TerritoryOrders = React.lazy(() => import("./pages/territory/TerritoryOrders"));
const TerritoryPayments = React.lazy(() => import("./pages/territory/TerritoryPayments"));
const TerritoryDocuments = React.lazy(() => import("./pages/territory/TerritoryDocuments"));
const TerritorySales = React.lazy(() => import("./pages/territory/TerritorySales"));
const TerritoryDealerPerformance = React.lazy(() => import("./pages/territory/TerritoryDealerPerformance"));
const TerritoryOutstanding = React.lazy(() => import("./pages/territory/TerritoryOutstanding"));
const TerritoryInventory = React.lazy(() => import("./pages/territory/TerritoryInventory"));

// Sales Executive Pages
const MyDealersPage = React.lazy(() => import("./pages/sales/MyDealersPage"));
const SalesCreateOrderPage = React.lazy(() => import("./pages/sales/SalesCreateOrderPage"));
const SalesCreatePaymentPage = React.lazy(() => import("./pages/sales/SalesCreatePaymentPage"));


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>

            {/* ================= PUBLIC ROUTES ================= */}
            <Route path="/login" element={<Login />} />
            <Route
              path="chat"
              element={
                <ProtectedRoute allowed={[
                  "super_admin",
                  "dealer_admin",
                  "dealer_staff",
                  "regional_manager",
                  "area_manager",
                  "territory_manager",
                  "technical_admin",
                  "finance_admin",
                  "inventory_user",
                  "accounts_user",
                  "regional_admin"
                ]}>
                  <ChatUI />
                </ProtectedRoute>
              }
            />



            {/* ================= PROTECTED LAYOUT (Navbar + Sidebar) ================= */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Layout />
                  </PageTransition>
                </ProtectedRoute>
              }
            >

              {/* ================= DEFAULT (ROLE-AWARE) ================= */}
              <Route index element={<RoleRedirect />} />
              <Route path="dashboard" element={<RoleRedirect />} />

              {/* ================= ROLE-BASED DASHBOARDS ================= */}
              <Route
                path="dashboard/super"
                element={
                  <ProtectedRoute allowed={["super_admin"]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/regional"
                element={
                  <ProtectedRoute allowed={["regional_admin"]}>
                    <RegionalAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/manager"
                element={
                  <ProtectedRoute allowed={["territory_manager", "area_manager"]}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/regional-manager"
                element={
                  <ProtectedRoute allowed={["regional_manager"]}>
                    <RegionalManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/area-manager"
                element={
                  <ProtectedRoute allowed={["area_manager"]}>
                    <AreaManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/territory-manager"
                element={
                  <ProtectedRoute allowed={["territory_manager"]}>
                    <TerritoryManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/dealer"
                element={
                  <ProtectedRoute allowed={["dealer_admin", "dealer_staff"]}>
                    <DealerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ================= TASKS ================= */}
              <Route
                path="tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />

              {/* ================= NOTIFICATIONS ================= */}
              <Route
                path="notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* ================= UNAUTHORIZED ================= */}
              <Route
                path="unauthorized"
                element={<Unauthorized />}
              />

              {/* ================= DEALER ADMIN PAGES ================= */}
              <Route
                path="staff"
                element={
                  <ProtectedRoute allowed={["dealer_admin"]}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />

              {/* ================= MANAGER PAGES ================= */}
              <Route
                path="dealers"
                element={
                  <ProtectedRoute
                    allowed={[
                      "territory_manager",
                      "area_manager",
                      "regional_manager",
                      "regional_admin",
                      "super_admin",
                    ]}
                  >
                    <DealerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dealers/:id"
                element={
                  <ProtectedRoute
                    allowed={[
                      "territory_manager",
                      "area_manager",
                      "regional_manager",
                      "regional_admin",
                      "super_admin",
                    ]}
                  >
                    <DealerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="approvals"
                element={
                  <ProtectedRoute allowed={["territory_manager", "area_manager", "regional_manager", "regional_admin", "super_admin", "dealer_admin", "sales_executive"]}>
                    <Approvals />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================
   REGION & TERRITORY MAP VIEW
============================================================ */}
              <Route
                path="map-view"
                element={
                  <ProtectedRoute
                    allowed={[
                      "super_admin",
                      "regional_manager",
                      "area_manager",
                      "territory_manager",
                      "dealer_admin",
                      "technical_admin",
                      "regional_admin"
                    ]}
                  >
                    <RegionMap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/approvals"
                element={
                  <ProtectedRoute allowed={["dealer_admin", "regional_manager", "regional_admin", "super_admin"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================
   SUPER ADMIN ONLY (NAMESPACED & CLEAN)
============================================================ */}

              <Route path="superadmin">

                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <Users />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="roles"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <Roles />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="documents"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <Documents />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="pricing"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <PricingApprovals />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <InventoryDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="accounts"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <AccountsDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="feature-toggles"
                  element={
                    <ProtectedRoute allowed={["super_admin", "technical_admin"]}>
                      <FeatureToggles />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="system-admin"
                  element={
                    <ProtectedRoute allowed={["super_admin", "technical_admin"]}>
                      <SystemAdmin />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="reports"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <SuperAdminReports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="teams"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <SuperAdminTeamManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="teams/performance"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <TeamPerformance />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="orders"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <AllOrders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="invoices"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <AllInvoices />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="payments"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <AllPayments />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="dealers"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <AllDealers />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="activity"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <UserActivity />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="region-reports"
                  element={
                    <ProtectedRoute allowed={["super_admin"]}>
                      <RegionWiseReports />
                    </ProtectedRoute>
                  }
                />

              </Route>
              <Route
                path="superadmin/users/new"
                element={
                  <ProtectedRoute allowed={["super_admin"]}>
                    <UserFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="superadmin/users/:id"
                element={
                  <ProtectedRoute allowed={["super_admin"]}>
                    <UserFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="superadmin/dealers/new"
                element={
                  <ProtectedRoute allowed={["super_admin"]}>
                    <DealerFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="superadmin/dealers/:id"
                element={
                  <ProtectedRoute allowed={["super_admin"]}>
                    <DealerFormPage />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================
               TECHNICAL ADMIN
            ============================================================ */}
              <Route
                path="technical-admin"
                element={
                  <ProtectedRoute allowed={["technical_admin"]}>
                    <TechnicalAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="materials"
                element={
                  <ProtectedRoute allowed={["technical_admin", "super_admin"]}>
                    <Materials />
                  </ProtectedRoute>
                }
              />

              <Route
                path="materials/import"
                element={
                  <ProtectedRoute allowed={["technical_admin", "super_admin"]}>
                    <MaterialImport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="materials/analytics"
                element={
                  <ProtectedRoute allowed={["technical_admin", "super_admin"]}>
                    <MaterialAnalytics />
                  </ProtectedRoute>
                }
              />

              <Route
                path="materials/regions"
                element={
                  <ProtectedRoute
                    allowed={[
                      "technical_admin",
                      "super_admin",
                      "inventory_user",
                      "regional_admin",
                    ]}
                  >
                    <RegionMaterialAvailability />
                  </ProtectedRoute>
                }
              />

              <Route
                path="materials/dealers"
                element={
                  <ProtectedRoute
                    allowed={[
                      "technical_admin",
                      "super_admin",
                      "inventory_user",
                      "regional_admin",
                    ]}
                  >
                    <DealerMaterialAssignment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="alerts/materials"
                element={
                  <ProtectedRoute allowed={["technical_admin", "super_admin", "inventory_user"]}>
                    <MaterialAlerts />
                  </ProtectedRoute>
                }
              />


              {/* ============================================================
               REGIONAL ADMIN
            ============================================================ */}
              <Route
                path="dealers"
                element={
                  <ProtectedRoute allowed={["regional_admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              <Route
                path="regions"
                element={
                  <ProtectedRoute allowed={["regional_admin"]}>
                    <AdminDocuments />
                  </ProtectedRoute>
                }
              />

              {/* Regional Admin Pages */}
              <Route path="regional">
                <Route
                  path="heatmap"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalHeatmap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalUserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="managers"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalManagers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalInvoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalPayments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="documents"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalDocuments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="pricing"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalPricing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="campaign-approvals"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <CampaignApprovals />
                    </ProtectedRoute>
                  }
                />
                <Route path="campaigns">
                  <Route
                    path=""
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <RegionalCampaigns />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analytics/:id"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <CampaignAnalytics />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="reports">
                  <Route
                    path=""
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <RegionalReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="territory"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <TerritoryPerformance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dealer"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <DealerPerformance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payments"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <OutstandingPayments />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="inventory">
                  <Route
                    path=""
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <RegionalInventory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="alerts"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <StockAlerts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="materials"
                    element={
                      <ProtectedRoute allowed={["regional_admin"]}>
                        <MaterialSummary />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route
                  path="approvals"
                  element={
                    <ProtectedRoute allowed={["regional_admin"]}>
                      <RegionalApprovals />
                    </ProtectedRoute>
                  }
                />
              </Route>


              {/* ============================================================
               FINANCE ADMIN
            ============================================================ */}
              {/* Note: invoices route moved to dealer section below to avoid route conflict */}
              <Route
                path="invoices/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="accounts"
                element={
                  <ProtectedRoute allowed={["finance_admin"]}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments/finance/pending"
                element={
                  <ProtectedRoute allowed={["finance_admin", "accounts_user"]}>
                    <FinancePendingPayments />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================
               AREA MANAGER
            ============================================================ */}
              <Route path="area">
                <Route
                  path="heatmap"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaHeatmap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="dealers"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaDealers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="staff"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaStaff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="approvals"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaApprovals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="documents"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaDocuments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaPayments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="pricing"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaPricing />
                    </ProtectedRoute>
                  }
                />
                <Route path="reports">
                  <Route
                    path="sales"
                    element={
                      <ProtectedRoute allowed={["area_manager"]}>
                        <AreaSales />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="outstanding"
                    element={
                      <ProtectedRoute allowed={["area_manager"]}>
                        <AreaOutstanding />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dealer-performance"
                    element={
                      <ProtectedRoute allowed={["area_manager"]}>
                        <AreaDealerPerformance />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route
                  path="campaigns"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaCampaigns />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute allowed={["area_manager"]}>
                      <AreaInventory />
                    </ProtectedRoute>
                  }
                />
              </Route>


              {/* ============================================================
               TERRITORY MANAGER
            ============================================================ */}
              <Route path="territory">
                <Route
                  path="dealers"
                  element={
                    <ProtectedRoute allowed={["territory_manager"]}>
                      <TerritoryDealers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <ProtectedRoute allowed={["territory_manager"]}>
                      <TerritoryOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <ProtectedRoute allowed={["territory_manager"]}>
                      <TerritoryPayments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="documents"
                  element={
                    <ProtectedRoute allowed={["territory_manager"]}>
                      <TerritoryDocuments />
                    </ProtectedRoute>
                  }
                />
                <Route path="reports">
                  <Route
                    path="sales"
                    element={
                      <ProtectedRoute allowed={["territory_manager"]}>
                        <TerritorySales />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dealer-performance"
                    element={
                      <ProtectedRoute allowed={["territory_manager"]}>
                        <TerritoryDealerPerformance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="outstanding"
                    element={
                      <ProtectedRoute allowed={["territory_manager"]}>
                        <TerritoryOutstanding />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute allowed={["territory_manager"]}>
                      <TerritoryInventory />
                    </ProtectedRoute>
                  }
                />
              </Route>


              {/* ============================================================
               DEALER ADMIN
            ============================================================ */}
              <Route
                path="dealer/profile"
                element={
                  <ProtectedRoute allowed={["dealer_admin", "dealer_staff"]}>
                    <DealerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="documents"
                element={
                  <ProtectedRoute allowed={["dealer_admin"]}>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="documents/:id"
                element={
                  <ProtectedRoute>
                    <DocumentDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="campaigns"
                element={
                  <ProtectedRoute allowed={["super_admin", "key_user", "dealer_admin", "regional_admin", "area_manager", "territory_manager"]}>
                    <Campaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="campaigns/:id"
                element={
                  <ProtectedRoute>
                    <CampaignDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="invoices"
                element={
                  <ProtectedRoute allowed={["dealer_admin", "dealer_staff", "finance_admin", "territory_manager", "area_manager", "regional_manager", "regional_admin"]}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />

              <Route
                path="chat"
                element={
                  <ProtectedRoute allowed={[
                    "super_admin",
                    "dealer_admin",
                    "dealer_staff",
                    "regional_manager",
                    "area_manager",
                    "territory_manager",
                    "technical_admin",
                    "finance_admin",
                    "inventory_user",
                    "accounts_user",
                    "regional_admin"
                  ]}>
                    <ChatUI />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/approvals"
                element={
                  <ProtectedRoute allowed={["dealer_admin"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments/dealer/pending"
                element={
                  <ProtectedRoute allowed={["dealer_admin"]}>
                    <DealerAdminPayments />
                  </ProtectedRoute>
                }
              />


              {/* ============================================================
               DEALER STAFF
            ============================================================ */}
              <Route
                path="documents"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/create"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <CreateOrder />
                  </ProtectedRoute>
                }
              />

              <Route
                path="orders/my"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments/create/:invoiceId"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <CreatePaymentRequest />
                  </ProtectedRoute>
                }
              />

              <Route
                path="payments/create"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <CreatePaymentRequest />
                  </ProtectedRoute>
                }
              />

              <Route
                path="payments/my"
                element={
                  <ProtectedRoute allowed={["dealer_staff"]}>
                    <MyPaymentRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments/:id"
                element={
                  <ProtectedRoute allowed={["dealer_staff", "dealer_admin", "finance_admin", "accounts_user", "super_admin", "regional_admin"]}>
                    <PaymentDetail />
                  </ProtectedRoute>
                }
              />



              {/* ============================================================
               INVENTORY USER
            ============================================================ */}
              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowed={["inventory_user"]}>
                    <InventoryDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="pricing"
                element={
                  <ProtectedRoute allowed={["inventory_user"]}>
                    <PricingApprovals />
                  </ProtectedRoute>
                }
              />


              {/* ============================================================
               ACCOUNTS USER
            ============================================================ */}
              <Route
                path="accounts"
                element={
                  <ProtectedRoute allowed={["accounts_user"]}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="accounts/invoices"
                element={
                  <ProtectedRoute allowed={["accounts_user"]}>
                    <AccountsInvoices />
                  </ProtectedRoute>
                }
              />

              <Route
                path="accounts/notes"
                element={
                  <ProtectedRoute allowed={["accounts_user"]}>
                    <AccountsNotes />
                  </ProtectedRoute>
                }
              />

              <Route
                path="accounts/reports"
                element={
                  <ProtectedRoute allowed={["accounts_user"]}>
                    <AccountsReports />
                  </ProtectedRoute>
                }
              />


              {/* ============================================================
               CHAT ROUTES
            ============================================================ */}
              <Route
                path="manager/chat"
                element={
                  <ProtectedRoute
                    allowed={[
                      "regional_manager",
                      "area_manager",
                      "territory_manager",
                    ]}
                  >
                    <ManagerChat />
                  </ProtectedRoute>
                }
              />

              <Route
                path="dealer/chat"
                element={
                  <ProtectedRoute allowed={["dealer_admin", "dealer_staff"]}>
                    <DealerChat />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================
               SALES EXECUTIVE
               ============================================================ */}
              <Route
                path="sales/my-dealers"
                element={
                  <ProtectedRoute allowed={["sales_executive"]}>
                    <MyDealersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sales/orders/new"
                element={
                  <ProtectedRoute allowed={["sales_executive"]}>
                    <SalesCreateOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sales/payments/new"
                element={
                  <ProtectedRoute allowed={["sales_executive"]}>
                    <SalesCreatePaymentPage />
                  </ProtectedRoute>
                }
              />

            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
