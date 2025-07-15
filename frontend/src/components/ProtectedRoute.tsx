
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfileComplete?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProfileComplete = true 
}) => {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  // If profile completion is required and user hasn't completed profile
  if (requireProfileComplete && !user?.profileCompleted) {
    return <Navigate to="/first-connection" replace />;
  }

  // If user has completed profile but tries to access first-connection
  if (!requireProfileComplete && user?.profileCompleted) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
