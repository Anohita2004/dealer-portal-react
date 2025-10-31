import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Documents from './pages/Documents';
import ProtectedRoute from './components/ProtectedRoute';

function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices/></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents/></ProtectedRoute>} />
          {/* Add routes for Campaigns, Reports, Admin */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
