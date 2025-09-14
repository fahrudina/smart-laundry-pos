import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from './use-toast';

// Duration type interface
export interface DurationType {
  id: string;
  store_id: string;
  name: string;
  description: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  price_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form data interface for creating/updating duration types
export interface DurationTypeFormData {
  name: string;
  description: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  price_multiplier: number;
  is_active?: boolean;
}

// Hook to fetch duration types for the current store
export const useDurationTypes = () => {
  const { currentStore } = useStore();
  
  return useQuery({
    queryKey: ['duration-types', currentStore?.store_id],
    queryFn: async (): Promise<DurationType[]> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      try {
        const { data, error } = await supabase
          .from('service_duration_types')
          .select('*')
          .eq('store_id', currentStore.store_id)
          .eq('is_active', true)
          .order('price_multiplier', { ascending: true });

        if (error) {
          console.error('Error fetching duration types:', error);
          throw error;
        }

        console.log('Fetched duration types from database:', data);
        return data || [];
      } catch (error) {
        console.error('Error in useDurationTypes:', error);
        return [];
      }
    },
    enabled: !!currentStore?.store_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create a new duration type
export const useCreateDurationType = () => {
  const queryClient = useQueryClient();
  const { currentStore } = useStore();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (durationTypeData: DurationTypeFormData): Promise<DurationType> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .from('service_duration_types')
        .insert([{
          ...durationTypeData,
          store_id: currentStore.store_id,
          is_active: durationTypeData.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating duration type:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duration-types'] });
      toast({
        title: "Success",
        description: "Duration type created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating duration type:', error);
      toast({
        title: "Error",
        description: "Failed to create duration type",
        variant: "destructive",
      });
    },
  });
};

// Hook to update an existing duration type
export const useUpdateDurationType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<DurationTypeFormData>): Promise<DurationType> => {
      const { data, error } = await supabase
        .from('service_duration_types')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating duration type:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duration-types'] });
      toast({
        title: "Success",
        description: "Duration type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating duration type:', error);
      toast({
        title: "Error",
        description: "Failed to update duration type",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a duration type
export const useDeleteDurationType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('service_duration_types')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting duration type:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duration-types'] });
      toast({
        title: "Success",
        description: "Duration type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting duration type:', error);
      toast({
        title: "Error",
        description: "Failed to delete duration type",
        variant: "destructive",
      });
    },
  });
};

// Hook to calculate service price with duration type
export const useServicePricing = () => {
  const calculatePrice = (
    basePrice: number, 
    durationType: DurationType,
    serviceType: 'unit' | 'kilo' = 'unit',
    quantity: number = 1
  ) => {
    const adjustedPrice = basePrice * durationType.price_multiplier;
    return adjustedPrice * quantity;
  };

  const calculateEstimatedCompletion = (
    durationType: DurationType,
    startDate: Date = new Date()
  ) => {
    const completionDate = new Date(startDate);
    
    if (durationType.duration_unit === 'hours') {
      completionDate.setHours(completionDate.getHours() + durationType.duration_value);
    } else {
      completionDate.setDate(completionDate.getDate() + durationType.duration_value);
    }
    
    return completionDate;
  };

  return {
    calculatePrice,
    calculateEstimatedCompletion,
  };
};

// Hook to get duration type by service duration (for backward compatibility)
export const useDurationTypeByDuration = (durationValue: number, durationUnit: 'hours' | 'days') => {
  const { data: durationTypes } = useDurationTypes();
  
  const matchingDurationType = durationTypes?.find(
    dt => dt.duration_value === durationValue && dt.duration_unit === durationUnit
  );
  
  return matchingDurationType;
};
