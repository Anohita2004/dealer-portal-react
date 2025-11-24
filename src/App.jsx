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
import InventoryDashboard from "./pages/dashboards/InventoryDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";

// 📄 Common Pages
import Invoices from "./pages/Invoices";
import Documents from "./pages/Documents";
import Campaigns from "./pages/Campaigns";
import Reports from "./pages/Reports";
import CreatePaymentRequest from "./pages/payments/CreatePaymentRequest";

import DealerAdminPayments from "./pages/payments/DealerAdminPayments";
import FinancePendingPayments from "./pages/payments/FinancePendingPayments";


// 🛠 Admin & Config
import Admin from "./pages/Admin";
import AdminDocuments from "./pages/AdminDocuments";
import PricingApprovals from "./pages/PricingApprovals";

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
import Materials from "./pages/Materials";
import ChatUI from "./pages/ChatUI";



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
      "accounts_user"
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


            {/* ============================================================
               SUPER ADMIN ONLY
            ============================================================ */}
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
    <ProtectedRoute allowed={["finance_admin"]}>
      <FinancePendingPayments />
    </ProtectedRoute>
  }
/>


            {/* ============================================================
               REGIONAL MANAGER
            ============================================================ */}
            <Route
              path="approvals"
              element={
                <ProtectedRoute allowed={["regional_manager"]}>
                  <PricingApprovals />
                </ProtectedRoute>
              }
            />

            <Route
              path="dealers"
              element={
                <ProtectedRoute allowed={["regional_manager"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />


            {/* ============================================================
               AREA MANAGER
            ============================================================ */}
            <Route
              path="dealers"
              element={
                <ProtectedRoute allowed={["area_manager"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />


            {/* ============================================================
               TERRITORY MANAGER
            ============================================================ */}
            <Route
              path="dealers"
              element={
                <ProtectedRoute allowed={["territory_manager"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />


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
              path="campaigns"
              element={
                <ProtectedRoute allowed={["dealer_admin"]}>
                  <Campaigns />
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
                <ProtectedRoute allowed={["dealer_admin"]}>
                  <DealerChat />
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
