import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from './LandingPage';
import { PageLoading } from '@/components/ui/loading-spinner';

export const SmartHomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is authenticated and not loading, redirect to POS
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  // If loading or user is authenticated (before redirect), show nothing or loading
  if (loading) {
    return <PageLoading text="Memuat..." />;
  }

  // If user is authenticated, they'll be redirected, but show loading state briefly
  if (user) {
    return <PageLoading text="Mengalihkan ke POS..." />;
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};
