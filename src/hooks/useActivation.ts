import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

export interface ActivationStatus {
  hasServices: boolean;
  hasOrder: boolean;
  hasCustomer: boolean;
  /** Number of completed onboarding steps (store is always step 1). */
  completedSteps: number;
  totalSteps: number;
  /** True once the owner has created their first order. */
  isActivated: boolean;
}

// Lightweight existence checks used to drive the "Getting Started" checklist on
// the home screen. Uses head/count queries (no rows fetched) so it's cheap.
const existsForStore = async (
  table: 'services' | 'orders' | 'customers',
  storeId: string
): Promise<boolean> => {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Only count active services (matches how the POS reads the catalog).
  if (table === 'services') {
    query = query.eq('is_active', true);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`Error checking existence in ${table}:`, error);
    return false;
  }
  return (count ?? 0) > 0;
};

/**
 * Returns the store's onboarding/activation status for the current store.
 * Drives the home-screen getting-started checklist; refetched when orders,
 * services or customers change via the shared query key invalidations.
 */
export const useActivation = () => {
  const { currentStore } = useStore();
  const storeId = currentStore?.store_id;

  return useQuery({
    queryKey: ['activation', storeId],
    enabled: !!storeId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ActivationStatus> => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      const [hasServices, hasOrder, hasCustomer] = await Promise.all([
        existsForStore('services', storeId),
        existsForStore('orders', storeId),
        existsForStore('customers', storeId),
      ]);

      // Step 1 (store created) is always complete on this screen.
      const completedSteps =
        1 + [hasServices, hasOrder, hasCustomer].filter(Boolean).length;

      return {
        hasServices,
        hasOrder,
        hasCustomer,
        completedSteps,
        totalSteps: 4,
        isActivated: hasOrder,
      };
    },
  });
};
