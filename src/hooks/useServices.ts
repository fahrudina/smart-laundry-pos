import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  
  // For now, we'll use a mock store_id since currentStore might not be available
  const store_id = user ? 'demo-store-id' : null;
  
  return useQuery({
    queryKey: ['services', store_id, category],
    queryFn: async (): Promise<ServiceData[]> => {
      if (!store_id) {
        throw new Error('No store selected');
      }

      // Use a simple approach since the services table might not be in generated types yet
      // We'll return mock data for now and update this when types are regenerated
      const mockServices: ServiceData[] = [
        {
          id: '1',
          store_id: store_id,
          name: 'Cuci Setrika Regular',
          description: 'Cuci - Pengeringan - Setrika - Packing',
          category: 'wash',
          unit_price: 18000,
          kilo_price: 6000,
          supports_unit: true,
          supports_kilo: true,
          duration_value: 2,
          duration_unit: 'days',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          store_id: store_id,
          name: 'Express Wash',
          description: 'Pencucian cepat dalam 24 jam',
          category: 'wash',
          unit_price: 25000,
          kilo_price: 8000,
          supports_unit: true,
          supports_kilo: true,
          duration_value: 1,
          duration_unit: 'days',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          store_id: store_id,
          name: 'Dry Clean Premium',
          description: 'Dry cleaning untuk pakaian formal',
          category: 'dry',
          unit_price: 35000,
          supports_unit: true,
          supports_kilo: false,
          duration_value: 3,
          duration_unit: 'days',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          store_id: store_id,
          name: 'Express Dry Clean',
          description: 'Dry cleaning express',
          category: 'dry',
          unit_price: 50000,
          supports_unit: true,
          supports_kilo: false,
          duration_value: 1,
          duration_unit: 'days',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '5',
          store_id: store_id,
          name: 'Setrika Saja',
          description: 'Layanan setrika dan pressing saja',
          category: 'ironing',
          unit_price: 5000,
          kilo_price: 3000,
          supports_unit: true,
          supports_kilo: true,
          duration_value: 4,
          duration_unit: 'hours',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '6',
          store_id: store_id,
          name: 'Hilangkan Noda',
          description: 'Treatment khusus untuk noda membandel',
          category: 'special',
          unit_price: 15000,
          supports_unit: true,
          supports_kilo: false,
          duration_value: 1,
          duration_unit: 'days',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Filter by category if specified
      let filteredServices = mockServices;
      if (category) {
        filteredServices = mockServices.filter(service => service.category === category);
      }

      return filteredServices;
    },
    enabled: !!store_id,
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
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (serviceData: ServiceFormData): Promise<ServiceData> => {
      // For now, return mock data since we need to implement the actual API call
      const newService: ServiceData = {
        id: Math.random().toString(36).substr(2, 9),
        store_id: 'demo-store-id',
        ...serviceData,
        is_active: serviceData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return newService;
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
      // For now, return mock data since we need to implement the actual API call
      const updatedService: ServiceData = {
        id,
        store_id: 'demo-store-id',
        name: 'Updated Service',
        category: 'wash',
        supports_unit: true,
        supports_kilo: false,
        duration_value: 1,
        duration_unit: 'days',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      
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
      // For now, just simulate the deletion
      console.log('Deleting service with id:', id);
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
