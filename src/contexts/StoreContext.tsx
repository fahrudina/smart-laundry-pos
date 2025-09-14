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
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext

  // Determine isOwner based on current store's ownership, not global user role
  const isOwner = currentStore?.is_owner ?? false;

  // Helper functions for localStorage persistence
  const isLocalStorageAvailable = (): boolean => {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('[StoreContext] localStorage is available');
      return true;
    } catch (e) {
      console.warn('[StoreContext] localStorage is NOT available', e);
      return false;
    }
  };

  const getPersistedStoreId = (): string | null => {
    if (!isLocalStorageAvailable()) {
      console.warn('[StoreContext] localStorage is not available');
      return null;
    }
    try {
      const val = localStorage.getItem('selected_store_id');
      console.log('[StoreContext] getPersistedStoreId:', val);
      return val;
    } catch (error) {
      console.error('[StoreContext] Error reading persisted store ID:', error);
      return null;
    }
  };

  const persistStoreId = (storeId: string | null): void => {
    if (!isLocalStorageAvailable()) {
      console.warn('[StoreContext] localStorage is not available, cannot persist store ID');
      return;
    }
    try {
      if (storeId) {
        localStorage.setItem('selected_store_id', storeId);
        console.log('[StoreContext] persistStoreId: set', storeId);
      } else {
        localStorage.removeItem('selected_store_id');
        console.log('[StoreContext] persistStoreId: removed');
      }
    } catch (error) {
      console.error('[StoreContext] Error persisting store ID:', error);
    }
  };

  const refreshStores = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        console.log('User not authenticated, skipping store refresh');
        setLoading(false);
        return;
      }

      if (isSwitching) {
        console.log('Currently switching stores, skipping refresh');
        return;
      }

      console.log('Fetching user stores...');
      setLoading(true);
      const stores = await authService.getUserStores();
      console.log('Stores fetched:', stores);
      
      setUserStores(stores);

      // Get persisted store ID once
      const persistedStoreId = getPersistedStoreId();

      if (stores.length > 0) {
        let selectedStore: StoreWithOwnershipInfo | null = null;

        // Priority 1: Try to restore persisted store (if valid)
        if (persistedStoreId) {
          const persisted = stores.find(s => s.store_id === persistedStoreId);
          if (persisted) {
            selectedStore = persisted;
            console.log('Restoring persisted store:', selectedStore);
          } else {
            console.log('Persisted store not found in fetched stores, will clear invalid key');
            persistStoreId(null); // Clear invalid persisted key
          }
        }

        // Priority 2: If no valid persisted store, keep currentStore if still accessible
        if (!selectedStore && currentStore) {
          const currentStillValid = stores.find(s => s.store_id === currentStore.store_id);
          if (currentStillValid) {
            selectedStore = currentStore;
            console.log('Keeping current store:', selectedStore);
            // Persist the current store since there was no valid persisted store
            if (!persistedStoreId) {
              persistStoreId(selectedStore.store_id);
            }
          }
        }

        // Priority 3: If still no selection, pick the first store as fallback
        if (!selectedStore) {
          selectedStore = stores[0];
          console.log('Auto-selecting first store as fallback:', selectedStore);
          // Only persist if there was no persisted store ID to begin with
          if (!persistedStoreId) {
            persistStoreId(selectedStore.store_id);
          }
        }

        setCurrentStore(selectedStore);
      } else {
        // No stores available
        setCurrentStore(null);
        if (persistedStoreId) {
          persistStoreId(null); // Only clear if there was a persisted store
        }
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
  }, [isSwitching, currentStore]);

  const switchStore = (storeId: string) => {
    console.log('switchStore called with storeId:', storeId);
    console.log('Available stores:', userStores.map(s => ({ id: s.store_id, name: s.store_name })));
    console.log('Current store before switch:', currentStore?.store_id);
    
    if (isSwitching) {
      console.log('Already switching stores, ignoring request');
      return;
    }
    
    const store = userStores.find(s => s.store_id === storeId);
    if (store) {
      console.log('Switching to store:', store);
      setIsSwitching(true);

      // Persist to localStorage FIRST, then update current store
      try {
        persistStoreId(store.store_id);
        console.log('Store ID persisted successfully');
      } catch (error) {
        console.error('Error persisting store ID:', error);
      }

      // Update current store
      setCurrentStore(store);

      // Show toast notification last (and make it optional)
      try {
        toast({
          title: "Store Switched",
          description: `Now working in: ${store.store_name}`,
        });
        console.log('Toast notification shown');
      } catch (error) {
        console.error('Error showing toast:', error);
      }

      // Reset switching flag after a short delay
      setTimeout(() => {
        setIsSwitching(false);
        console.log('Store switching completed');
      }, 500);
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


  const value: StoreContextType = {
    currentStore,
    userStores,
    isOwner,
    loading,
    switchStore,
    refreshStores,
  };

  // Only show loading screen on initial load, not during store operations
  if (loading && userStores.length === 0 && !currentStore) {
    return <div>Loading stores...</div>;
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};