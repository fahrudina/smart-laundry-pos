import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OwnerRouteProps {
  children: React.ReactNode;
}

export const OwnerRoute: React.FC<OwnerRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'laundry_owner') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
