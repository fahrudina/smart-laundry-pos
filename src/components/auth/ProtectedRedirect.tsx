import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoading } from '@/components/ui/loading-spinner';

export const ProtectedRedirect = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to Home page
        navigate('/home', { replace: true });
      } else {
        // Redirect unauthenticated users to landing page
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return <PageLoading text="Mengalihkan..." />;
};
