import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// PrivateRoute: Only accessible if user is logged in
export const PrivateRoute = () => {
  const token = localStorage.getItem('accessToken');
  return token ? <Outlet /> : <Navigate to="/login" />;
};

// PublicRoute: Redirects to Feed if user is already logged in
export const PublicRoute = () => {
  const token = localStorage.getItem('accessToken');
  return token ? <Navigate to="/feed" /> : <Outlet />;
};