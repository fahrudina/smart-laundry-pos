import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { offlineDb } from '@/lib/offlineDb';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
}

const filterCachedCustomers = (customers: Customer[], query: string): Customer[] => {
  const q = query.toLowerCase();
  return customers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
  );
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentStore } = useStore();
  const { toast } = useToast();

  // Background write-through: whenever a store is selected and we're
  // online, refresh the full customer-list cache for that store so
  // searchCustomers has something to fall back on once offline.
  useEffect(() => {
    const storeId = currentStore?.store_id;
    if (!storeId || !navigator.onLine) return;

    (async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        await offlineDb.cachedCustomers.put({ storeId, customers: data, cachedAt: Date.now() });
      }
    })();
  }, [currentStore?.store_id]);

  const searchCustomers = async (query: string) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (!navigator.onLine) {
        const cached = await offlineDb.cachedCustomers.get(currentStore.store_id);
        setCustomers(filterCachedCustomers(cached?.customers ?? [], query));
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      try {
        const cached = await offlineDb.cachedCustomers.get(currentStore.store_id);
        setCustomers(filterCachedCustomers(cached?.customers ?? [], query));
      } catch {
        // no cache available either - fall through to the error toast below
      }
      toast({
        title: "Error",
        description: "Failed to search customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          store_id: currentStore.store_id
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCustomerByPhone = async (phone: string) => {
    if (!currentStore) return null;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('store_id', currentStore.store_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting customer by phone:', error);
      return null;
    }
  };

  const getAllCustomers = async () => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    searchCustomers,
    addCustomer,
    getCustomerByPhone,
    getAllCustomers,
  };
};