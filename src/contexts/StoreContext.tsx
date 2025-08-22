import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext

  // Determine isOwner based on current store's ownership, not global user role
  const isOwner = currentStore?.is_owner ?? false;

  // Helper functions for localStorage persistence
  const getPersistedStoreId = (): string | null => {
    try {
      return localStorage.getItem('selected_store_id');
    } catch (error) {
      console.error('Error reading persisted store ID:', error);
      return null;
    }
  };

  const persistStoreId = (storeId: string | null): void => {
    try {
      if (storeId) {
        localStorage.setItem('selected_store_id', storeId);
      } else {
        localStorage.removeItem('selected_store_id');
      }
    } catch (error) {
      console.error('Error persisting store ID:', error);
    }
  };

  const refreshStores = useCallback(async () => {
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

      // Try to restore previously selected store
      const persistedStoreId = getPersistedStoreId();
      let targetStore: StoreWithOwnershipInfo | null = null;

      if (persistedStoreId) {
        // Check if persisted store is still accessible
        targetStore = stores.find(s => s.store_id === persistedStoreId) || null;
        if (targetStore) {
          console.log('Restoring persisted store:', targetStore);
        } else {
          console.log('Persisted store no longer accessible, clearing persistence');
          persistStoreId(null);
        }
      }

      // Auto-select store based on priority:
      // 1. Current store if still accessible
      // 2. Persisted store if accessible
      // 3. First available store
      if (stores.length > 0) {
        setCurrentStore(currentStoreState => {
          // Priority 1: Keep current store if it's still in the list
          if (currentStoreState && stores.find(s => s.store_id === currentStoreState.store_id)) {
            console.log('Keeping current store:', currentStoreState);
            return currentStoreState;
          }
          
          // Priority 2: Use persisted store if available
          if (targetStore) {
            console.log('Setting restored store:', targetStore);
            return targetStore;
          }
          
          // Priority 3: Select first available store only if no current store
          if (!currentStoreState) {
            console.log('Auto-selecting first store:', stores[0]);
            persistStoreId(stores[0].store_id);
            return stores[0];
          }
          
          // If current store is no longer accessible, keep the current state
          // instead of auto-switching to first store
          console.log('Current store no longer accessible, but keeping selection to avoid auto-switch');
          return currentStoreState;
        });
      } else {
        // No stores available
        setCurrentStore(null);
        persistStoreId(null);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('not authenticated')) {
        console.log('Authentication error, user may need to log in again');
        return; // Don't show error toast for auth issues
      }
      
      console.error('Error fetching stores:', error);
      // Note: Removed toast notification to prevent dependency issues
    } finally {
      setLoading(false);
    }
  }, []);

  const switchStore = (storeId: string) => {
    console.log('switchStore called with storeId:', storeId);
    console.log('Available stores:', userStores.map(s => ({ id: s.store_id, name: s.store_name })));
    
    const store = userStores.find(s => s.store_id === storeId);
    if (store) {
      console.log('Switching to store:', store);
      setCurrentStore(store);
      persistStoreId(store.store_id);
      
      toast({
        title: "Store Switched",
        description: `Now working in: ${store.store_name}`,
      });
    } else {
      console.error('Store not found with ID:', storeId);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      refreshStores();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setLoading(false);
      persistStoreId(null); // Clear persisted store on logout
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Reset store context when user logs out (backup check)
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setCurrentStore(null);
      setUserStores([]);
      persistStoreId(null); // Clear persisted store on logout
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
