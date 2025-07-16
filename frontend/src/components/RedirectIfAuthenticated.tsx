import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user, isLoadingUser } = useAuth();

  if (isLoadingUser) return null;

  if (isLoggedIn && user) {
    return user.profileCompleted ? <Navigate to="/home" replace /> : <Navigate to="/first-connection" replace />;
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
