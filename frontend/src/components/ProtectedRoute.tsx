
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

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  if (requireProfileComplete && !user.profileCompleted) {
    return <Navigate to="/first-connection" replace />;
  }

if (!requireProfileComplete && user.profileCompleted) {
  // Il veut aller sur /first-connection mais il a déjà fini son profil => va sur /home
  return <Navigate to="/home" replace />;
}


  return <>{children}</>;
};

export default ProtectedRoute;
