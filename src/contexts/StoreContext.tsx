import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { StoreContextType, StoreWithOwnershipInfo } from '@/types/multi-tenant';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<StoreWithOwnershipInfo | null>(null);
  const [userStores, setUserStores] = useState<StoreWithOwnershipInfo[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext

  const refreshStores = async () => {
    try {
      if (!authService.isAuthenticated()) {
        console.log('User not authenticated, skipping store refresh');
        setLoading(false);
        return;
      }

      console.log('Fetching user stores...');
      setLoading(true);
      const stores = await authService.getUserStores();
      console.log('Stores fetched:', stores);
      
      setUserStores(stores);
      setIsOwner(authService.isOwner());

      // Auto-select first store if none selected
      if (stores.length > 0 && !currentStore) {
        console.log('Auto-selecting first store:', stores[0]);
        setCurrentStore(stores[0]);
      }

      // If current store is no longer accessible, switch to first available
      if (currentStore && !stores.find(s => s.store_id === currentStore.store_id)) {
        console.log('Current store no longer accessible, switching to first available');
        setCurrentStore(stores.length > 0 ? stores[0] : null);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('not authenticated')) {
        console.log('Authentication error, user may need to log in again');
        return; // Don't show error toast for auth issues
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchStore = (storeId: string) => {
    const store = userStores.find(s => s.store_id === storeId);
    if (store) {
      setCurrentStore(store);
      toast({
        title: "Store Switched",
        description: `Now working in: ${store.store_name}`,
      });
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      refreshStores();
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for user authentication changes
  useEffect(() => {
    if (user) {
      // User just logged in, refresh stores
      console.log('User authenticated, refreshing stores...');
      refreshStores();
    } else {
      // User logged out, reset store context
      console.log('User logged out, resetting store context...');
      setCurrentStore(null);
      setUserStores([]);
      setIsOwner(false);
      setLoading(false);
    }
  }, [user]);

  // Reset store context when user logs out (backup check)
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setCurrentStore(null);
      setUserStores([]);
      setIsOwner(false);
    }
  }, []);

  const value: StoreContextType = {
    currentStore,
    userStores,
    isOwner,
    loading,
    switchStore,
    refreshStores,
  };

  if (loading) {
    return <div>Loading stores...</div>;
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
