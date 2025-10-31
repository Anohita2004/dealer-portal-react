import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
