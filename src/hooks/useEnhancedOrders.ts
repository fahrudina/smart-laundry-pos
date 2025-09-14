import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { useFeatureFlags } from '@/lib/featureFlags';
import { DurationType } from '@/hooks/useDurationTypes';
import type { CreateOrderData } from '@/hooks/useOrdersOptimized';

// Enhanced order item with duration type support
export interface EnhancedOrderItem {
  service_name: string;
  service_price: number;
  quantity: number;
  estimated_completion?: string;
  service_type: 'unit' | 'kilo' | 'combined';
  weight_kg?: number;
  unit_items?: Array<{
    item_name: string;
    quantity: number;
    price_per_unit: number;
  }>;
  
  // Duration type information
  durationType?: DurationType;
  base_price?: number;
  price_multiplier?: number;
}

// Enhanced order data
export interface EnhancedOrderData {
  customer_name: string;
  customer_phone: string;
  items: EnhancedOrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  execution_status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_amount?: number;
  cash_received?: number;
  payment_notes?: string;
  order_date?: string;
  estimated_completion?: string;
}

// Enhanced order creation hook
export const useEnhancedCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentStore } = useStore();
  const { shouldUseDurationTypes } = useFeatureFlags();

  return useMutation({
    mutationFn: async (orderData: EnhancedOrderData) => {
      if (!currentStore) {
        throw new Error('No store selected');
      }

      const useDurationTypes = shouldUseDurationTypes(currentStore.store_id);
      
      // Convert enhanced order data to standard format
      const standardOrderData: CreateOrderData = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount,
        total_amount: orderData.total_amount,
        execution_status: orderData.execution_status,
        payment_status: orderData.payment_status,
        payment_method: orderData.payment_method,
        payment_amount: orderData.payment_amount,
        cash_received: orderData.cash_received,
        payment_notes: orderData.payment_notes,
        order_date: orderData.order_date,
        estimated_completion: orderData.estimated_completion,
        items: orderData.items.map(item => {
          const standardItem = {
            service_name: item.service_name,
            service_price: item.service_price,
            quantity: item.quantity,
            estimated_completion: item.estimated_completion,
            service_type: item.service_type,
            weight_kg: item.weight_kg,
            unit_items: item.unit_items,
          };

          // Add duration type fields only if feature is enabled
          if (useDurationTypes && item.durationType) {
            return {
              ...standardItem,
              service_duration_type_id: item.durationType.id,
              selected_duration_value: item.durationType.duration_value,
              selected_duration_unit: item.durationType.duration_unit,
              duration_price_multiplier: item.durationType.price_multiplier,
            };
          }

          return standardItem;
        }),
      };

      // Create the order using the standard hook logic
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: standardOrderData.customer_name,
          customer_phone: standardOrderData.customer_phone,
          subtotal: standardOrderData.subtotal,
          tax_amount: standardOrderData.tax_amount,
          total_amount: standardOrderData.total_amount,
          execution_status: standardOrderData.execution_status || 'in_queue',
          payment_status: standardOrderData.payment_status || 'pending',
          payment_method: standardOrderData.payment_method,
          payment_amount: standardOrderData.payment_amount,
          payment_notes: standardOrderData.payment_notes,
          order_date: standardOrderData.order_date || new Date().toISOString(),
          estimated_completion: standardOrderData.estimated_completion,
          store_id: currentStore.store_id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with enhanced data
      const orderItems = standardOrderData.items.map(item => {
        const baseItem = {
          order_id: order.id,
          service_name: item.service_name,
          service_price: item.service_price,
          quantity: Math.ceil(item.quantity),
          line_total: item.service_price * item.quantity,
          estimated_completion: item.estimated_completion,
          service_type: item.service_type || 'unit',
          weight_kg: item.weight_kg,
          unit_items: item.service_type === 'kilo' ? 0 : item.unit_items,
        };

        // Add duration type fields if available
        if (useDurationTypes && 'service_duration_type_id' in item) {
          return {
            ...baseItem,
            service_duration_type_id: item.service_duration_type_id,
            selected_duration_value: item.selected_duration_value,
            selected_duration_unit: item.selected_duration_unit,
            duration_price_multiplier: item.duration_price_multiplier,
          };
        }

        return baseItem;
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      // Invalidate all order queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Success",
        description: "Order processed successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating enhanced order:', error);
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Helper to calculate pricing with duration types
export const calculateEnhancedPricing = (
  basePrice: number,
  durationType?: DurationType,
  quantity: number = 1
) => {
  if (!durationType) {
    return basePrice * quantity;
  }
  
  return basePrice * durationType.price_multiplier * quantity;
};

// Helper to calculate estimated completion with duration types
export const calculateEnhancedCompletion = (
  durationType?: DurationType,
  startDate: Date = new Date(),
  fallbackDuration?: { value: number; unit: 'hours' | 'days' }
) => {
  const completionDate = new Date(startDate);
  
  if (durationType) {
    // Use duration type
    if (durationType.duration_unit === 'hours') {
      completionDate.setHours(completionDate.getHours() + durationType.duration_value);
    } else {
      completionDate.setDate(completionDate.getDate() + durationType.duration_value);
    }
  } else if (fallbackDuration) {
    // Use fallback duration (legacy system)
    if (fallbackDuration.unit === 'hours') {
      completionDate.setHours(completionDate.getHours() + fallbackDuration.value);
    } else {
      completionDate.setDate(completionDate.getDate() + fallbackDuration.value);
    }
  }
  
  return completionDate;
};
