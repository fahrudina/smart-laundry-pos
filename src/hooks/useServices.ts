import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from './use-toast';

// Service data interface matching the database schema
export interface ServiceData {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding' | 'detergent' | 'perfume' | 'softener' | 'other_goods';
  item_type?: 'service' | 'product';
  unit_price?: number;
  kilo_price?: number;
  supports_unit: boolean;
  supports_kilo: boolean;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form data interface for creating/updating services
export interface ServiceFormData {
  name: string;
  description?: string;
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding' | 'detergent' | 'perfume' | 'softener' | 'other_goods';
  item_type?: 'service' | 'product';
  unit_price?: number;
  kilo_price?: number;
  supports_unit: boolean;
  supports_kilo: boolean;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  is_active?: boolean;
}

// Default starter services seeded for a new store so the POS is usable
// immediately. Keep in sync with the create_store() SQL function
// (supabase/migrations/20260621000000_seed_default_services_on_store_create.sql).
export const DEFAULT_SERVICES: ServiceFormData[] = [
  {
    name: 'Cuci Setrika Regular',
    description: 'Cuci - Pengeringan - Setrika - Packing',
    category: 'wash',
    unit_price: 18000,
    kilo_price: 6000,
    supports_unit: true,
    supports_kilo: true,
    duration_value: 2,
    duration_unit: 'days',
  },
  {
    name: 'Express Wash',
    description: 'Pencucian cepat dalam 24 jam',
    category: 'wash',
    unit_price: 25000,
    kilo_price: 8000,
    supports_unit: true,
    supports_kilo: true,
    duration_value: 1,
    duration_unit: 'days',
  },
  {
    name: 'Setrika Saja',
    description: 'Layanan setrika dan pressing saja',
    category: 'ironing',
    unit_price: 5000,
    kilo_price: 3000,
    supports_unit: true,
    supports_kilo: true,
    duration_value: 4,
    duration_unit: 'hours',
  },
];

// Hook to fetch services for the current store
export const useServices = (category?: string) => {
  const { currentStore } = useStore();
  
  return useQuery({
    queryKey: ['services', currentStore?.store_id, category],
    queryFn: async (): Promise<ServiceData[]> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      try {
        let query = supabase
          .from('services')
          .select('*')
          .eq('store_id', currentStore.store_id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching services:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in useServices:', error);
        // If database fetch fails, return empty array instead of mock data
        return [];
      }
    },
    enabled: !!currentStore?.store_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch services by category
export const useServicesByCategory = (category: string) => {
  const servicesQuery = useServices(category);
  return {
    ...servicesQuery,
    services: servicesQuery.data || [],
  };
};

// Hook to create a new service
export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { currentStore } = useStore();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (serviceData: ServiceFormData): Promise<ServiceData> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          store_id: currentStore.store_id,
          is_active: serviceData.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating service:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    },
  });
};

// Hook to seed the default starter services for the current store in one batch.
// Used by empty-state CTAs (POS notice, Service Management) so a new owner can
// get a working catalog with a single tap.
export const useSeedDefaultServices = () => {
  const queryClient = useQueryClient();
  const { currentStore } = useStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      const { error } = await supabase
        .from('services')
        .insert(
          DEFAULT_SERVICES.map((service) => ({
            ...service,
            store_id: currentStore.store_id,
            is_active: true,
          }))
        );

      if (error) {
        console.error('Error seeding default services:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Berhasil',
        description: 'Contoh layanan berhasil dibuat',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Gagal memuat contoh layanan',
        variant: 'destructive',
      });
    },
  });
};

// Hook to update a service
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceFormData> }): Promise<ServiceData> => {
      const { data: updatedService, error } = await supabase
        .from('services')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating service:', error);
        throw error;
      }

      return updatedService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a service
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('services')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });
};
