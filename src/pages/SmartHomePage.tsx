import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from './LandingPage';

export const SmartHomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is authenticated and not loading, redirect to POS
    if (!loading && user) {
      navigate('/pos', { replace: true });
    }
  }, [user, loading, navigate]);

  // If loading or user is authenticated (before redirect), show nothing or loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, they'll be redirected, but show loading state briefly
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to POS...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};
