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
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding';
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
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding';
  unit_price?: number;
  kilo_price?: number;
  supports_unit: boolean;
  supports_kilo: boolean;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  is_active?: boolean;
}

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

        console.log('Fetched services from database:', data);
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
