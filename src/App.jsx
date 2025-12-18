import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// 🔐 Auth
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// 🔑 Public
import Login from "./pages/Login";

// 🧭 Dashboards
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard";
import RegionalAdminDashboard from "./pages/dashboards/RegionalAdminDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import RegionalManagerDashboard from "./pages/dashboards/RegionalManagerDashboard";
import AreaManagerDashboard from "./pages/dashboards/AreaManagerDashboard";
import TerritoryManagerDashboard from "./pages/dashboards/TerritoryManagerDashboard";
import DealerDashboard from "./pages/dashboards/DealerDashboard";
import InventoryDashboard from "./pages/dashboards/InventoryDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";

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


// 🛠 Admin & Config
import Admin from "./pages/Admin";
import AdminDocuments from "./pages/AdminDocuments";
import PricingApprovals from "./pages/PricingApprovals";
import PricingRequestDetail from "./pages/pricing/PricingRequestDetail";

// 💼 Accounts subpages
import AccountsInvoices from "./pages/accounts/AccountsInvoices";
import AccountsNotes from "./pages/accounts/AccountsNotes";
import AccountsReports from "./pages/accounts/AccountsReports";

// 💬 Chat
import ManagerChat from "./pages/ManagerChat";
import DealerChat from "./pages/DealerChat";

// 🆕 Super Admin CRUD pages (you will build these)
import Users from "./pages/superadmin/Users";
import Roles from "./pages/superadmin/Roles";
import TechnicalAdmin from "./pages/technicaladmin/TechnicalAdmin";
import AdminOrders from "./pages/orders/AdminOrders";
import CreateOrder from "./pages/orders/CreateOrders";
import MyOrders from "./pages/orders/MyOrders";
import OrderDetail from "./pages/orders/OrderDetail";
import Materials from "./pages/Materials";
import ChatUI from "./pages/ChatUI";
import MaterialImport from "./pages/Materials/MaterialImport";
import MaterialAnalytics from "./pages/Materials/MaterialAnalytics";
import MaterialAlerts from "./pages/Alerts/MaterialAlerts";

import RegionMap from "./pages/maps/RegionMaps";
import FeatureToggles from "./pages/superadmin/FeatureToggles";
import SystemAdmin from "./pages/superadmin/SystemAdmin";
import SuperAdminReports from "./pages/superadmin/SuperAdminReports";
import Unauthorized from "./pages/Unauthorized";
import StaffManagement from "./pages/StaffManagement";
import DealerManagement from "./pages/DealerManagement";
import Approvals from "./pages/Approvals";
import AllOrders from "./pages/superadmin/AllOrders";
import AllInvoices from "./pages/superadmin/AllInvoices";
import AllPayments from "./pages/superadmin/AllPayments";
import AllDealers from "./pages/superadmin/AllDealers";
import UserActivity from "./pages/superadmin/UserActivity";
import TeamPerformance from "./pages/superadmin/TeamPerformance";
import RegionWiseReports from "./pages/superadmin/RegionWiseReports";

import MyPaymentRequests from "./pages/payments/MyPaymentRequest";
import Tasks from "./pages/Tasks";
import Notifications from "./pages/Notifications";

// Regional Admin Pages
import RegionalUserManagement from "./pages/regional/RegionalUserManagement";
import RegionalReports from "./pages/regional/RegionalReports";
import RegionalApprovals from "./pages/regional/RegionalApprovals";
import RegionalHeatmap from "./pages/regional/RegionalHeatmap";
import RegionalManagers from "./pages/regional/RegionalManagers";
import RegionalOrders from "./pages/regional/RegionalOrders";
import RegionalInvoices from "./pages/regional/RegionalInvoices";
import RegionalPayments from "./pages/regional/RegionalPayments";
import RegionalDocuments from "./pages/regional/RegionalDocuments";
import RegionalPricing from "./pages/regional/RegionalPricing";
import CampaignApprovals from "./pages/regional/CampaignApprovals";
import RegionalCampaigns from "./pages/regional/RegionalCampaigns";
import CampaignAnalytics from "./pages/regional/CampaignAnalytics";
import TerritoryPerformance from "./pages/regional/TerritoryPerformance";
import DealerPerformance from "./pages/regional/DealerPerformance";
import OutstandingPayments from "./pages/regional/OutstandingPayments";
import RegionalInventory from "./pages/regional/RegionalInventory";
import StockAlerts from "./pages/regional/StockAlerts";
import MaterialSummary from "./pages/regional/MaterialSummary";

// Area Manager Pages
import AreaHeatmap from "./pages/area/AreaHeatmap";
import AreaDealers from "./pages/area/AreaDealers";
import AreaStaff from "./pages/area/AreaStaff";
import AreaApprovals from "./pages/area/AreaApprovals";
import AreaOrders from "./pages/area/AreaOrders";
import AreaDocuments from "./pages/area/AreaDocuments";
import AreaPayments from "./pages/area/AreaPayments";
import AreaPricing from "./pages/area/AreaPricing";
import AreaSales from "./pages/area/AreaSales";
import AreaOutstanding from "./pages/area/AreaOutstanding";
import AreaDealerPerformance from "./pages/area/AreaDealerPerformance";
import AreaCampaigns from "./pages/area/AreaCampaigns";
import AreaInventory from "./pages/area/AreaInventory";

// Territory Manager Pages
import TerritoryDealers from "./pages/territory/TerritoryDealers";
import TerritoryOrders from "./pages/territory/TerritoryOrders";
import TerritoryPayments from "./pages/territory/TerritoryPayments";
import TerritoryDocuments from "./pages/territory/TerritoryDocuments";
import TerritorySales from "./pages/territory/TerritorySales";
import TerritoryDealerPerformance from "./pages/territory/TerritoryDealerPerformance";
import TerritoryOutstanding from "./pages/territory/TerritoryOutstanding";
import TerritoryInventory from "./pages/territory/TerritoryInventory";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
                <Layout />
              </ProtectedRoute>
            }
          >

            {/* ================= DEFAULT ================= */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
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
                <ProtectedRoute allowed={["territory_manager", "area_manager", "regional_manager"]}>
                  <DealerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="approvals"
              element={
                <ProtectedRoute allowed={["territory_manager", "area_manager", "regional_manager", "regional_admin", "super_admin"]}>
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
<Route path="superadmin/users/new" element={<ProtectedRoute allowed={["super_admin"]}><UserFormPage /></ProtectedRoute>} />

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
            <Route
              path="invoices"
              element={
                <ProtectedRoute allowed={["finance_admin"]}>
                  <Invoices />
                </ProtectedRoute>
              }
            />
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
                <ProtectedRoute allowed={["dealer_admin"]}>
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

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
