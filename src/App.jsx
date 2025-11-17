import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import Invoices from './pages/Invoices';
import Documents from './pages/Documents';
import Campaigns from "./pages/Campaigns";
import Reports from "./pages/Reports";

import Admin from "./pages/Admin";
import AdminDocuments from "./pages/AdminDocuments";
import PricingApprovals from "./pages/PricingApprovals";

import InventoryDashboard from "./pages/dashboards/InventoryDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";

import AccountsInvoices from "./pages/accounts/AccountsInvoices";
import AccountsNotes from "./pages/accounts/AccountsNotes";
import AccountsReports from "./pages/accounts/AccountsReports";

import ManagerChat from "./pages/ManagerChat";
import DealerChat from "./pages/DealerChat";

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >

            {/* Default */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Common */}
            <Route path="documents" element={<Documents />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="reports" element={<Reports />} />

            {/* Admin */}
            <Route path="admin" element={<Admin />} />
            <Route path="admin/documents" element={<AdminDocuments />} />
            <Route path="pricing-approvals" element={<PricingApprovals />} />

            {/* Inventory role */}
            <Route path="inventory" element={<InventoryDashboard />} />

            {/* Accounts role */}
            <Route path="accounts" element={<AccountsDashboard />} />
            <Route path="accounts/invoices" element={<AccountsInvoices />} />
            <Route path="accounts/notes" element={<AccountsNotes />} />
            <Route path="accounts/reports" element={<AccountsReports />} />

            {/* Chat */}
            <Route path="manager/chat" element={<ManagerChat />} />
            <Route path="dealer/chat" element={<DealerChat />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
