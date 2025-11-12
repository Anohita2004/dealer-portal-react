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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InventoryDashboard from "./pages/dashboards/InventoryDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";
import AccountsInvoices from "./pages/accounts/AccountsInvoices";
import AccountsNotes from "./pages/accounts/AccountsNotes";
import AccountsReports from "./pages/accounts/AccountsReports";
import AdminDocuments from "./pages/AdminDocuments";
import PricingApprovals from "./pages/PricingApprovals";


// inside <Routes>



// ✅ When Layout is inside ProtectedRoute, all child routes share Navbar & Sidebar
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes grouped inside Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* All pages with the sidebar/navbar go here */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="documents" element={<Documents />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin" element={<Admin />} />
            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="accounts" element={<AccountsDashboard />} />
            <Route path="accounts/invoices" element={<AccountsInvoices />} />
<Route path="accounts/notes" element={<AccountsNotes />} />
<Route path="accounts/reports" element={<AccountsReports />} />

<Route path="/admin/documents" element={<AdminDocuments />} />
<Route path="/pricing-approvals" element={<PricingApprovals />} />


            {/* 🔜 Add Campaigns, Reports, Admin here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

