import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { currentStore, userStores, loading: storeLoading } = useStore();
  const location = useLocation();

  // Show loading if either auth or store is loading
  const isLoading = authLoading || (user && storeLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-[350px]">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="text-center text-sm text-gray-500 mt-4">
            {authLoading ? 'Authenticating...' : 'Loading stores...'}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Additional check: if user is authenticated but no stores are available
  if (user && !storeLoading && userStores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">No Store Access</h2>
          <p className="text-gray-600">
            You don't have access to any stores. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
