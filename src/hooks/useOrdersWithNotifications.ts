import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import type { CreateOrderData, UnitItem } from './useOrdersOptimized';

// Re-export types for convenience
export type { CreateOrderData, UnitItem };

const ORDERS_QUERY_KEY = ['orders'];

/**
 * Enhanced create order hook with WhatsApp notifications
 */
export const useCreateOrderWithNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentStore } = useStore();
  const { notifyOrderCreated } = useWhatsApp();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      if (!currentStore) {
        throw new Error('No store selected');
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount,
          total_amount: orderData.total_amount,
          execution_status: orderData.execution_status || 'in_queue',
          payment_status: orderData.payment_status || 'pending',
          payment_method: orderData.payment_method,
          payment_amount: orderData.payment_amount,
          payment_notes: orderData.payment_notes,
          order_date: orderData.order_date || new Date().toISOString(),
          estimated_completion: orderData.estimated_completion,
          store_id: currentStore.store_id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        service_name: item.service_name,
        service_price: item.service_price,
        quantity: item.quantity,
        line_total: item.service_price * item.quantity,
        estimated_completion: item.estimated_completion,
        service_type: item.service_type || 'unit',
        weight_kg: item.weight_kg,
        unit_items: item.unit_items,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send WhatsApp notification (non-blocking)
      // We don't await this to avoid blocking the order creation
      notifyOrderCreated(orderData.customer_phone, {
        orderId: order.id.slice(-8).toUpperCase(),
        customerName: orderData.customer_name,
        totalAmount: orderData.total_amount,
        estimatedCompletion: orderData.estimated_completion 
          ? new Date(orderData.estimated_completion).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Akan dikonfirmasi',
        services: orderData.items.map(item => item.service_name),
      }).catch(error => {
        // Log WhatsApp notification errors but don't fail the order
        console.warn('WhatsApp notification failed:', error);
      });

      return order;
    },
    onSuccess: () => {
      // Invalidate all order queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast({
        title: "Success",
        description: "Order processed successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process order",
        variant: "destructive",
      });
    },
  });
};

/**
 * Enhanced update execution status hook with WhatsApp notifications
 */
export const useUpdateExecutionStatusWithNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyOrderCompleted } = useWhatsApp();

  return useMutation({
    mutationFn: async ({
      orderId,
      executionStatus,
      executionNotes,
      orderData, // Pass order data for notification
    }: {
      orderId: string;
      executionStatus: string;
      executionNotes?: string;
      orderData?: {
        customer_name: string;
        customer_phone: string;
        total_amount: number;
        order_items: Array<{ service_name: string }>;
      };
    }) => {
      // Update the order
      const { error } = await supabase
        .from('orders')
        .update({
          execution_status: executionStatus,
          execution_notes: executionNotes,
        })
        .eq('id', orderId);

      if (error) throw error;

      // Send WhatsApp notification for completed orders
      if (executionStatus === 'completed' && orderData) {
        notifyOrderCompleted(orderData.customer_phone, {
          orderId: orderId.slice(-8).toUpperCase(),
          customerName: orderData.customer_name,
          totalAmount: orderData.total_amount,
          completedAt: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          services: orderData.order_items.map(item => item.service_name),
        }).catch(error => {
          // Log WhatsApp notification errors but don't fail the status update
          console.warn('WhatsApp notification failed:', error);
        });
      }

      return { orderId, executionStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast({
        title: "Success",
        description: "Execution status updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating execution status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update execution status",
        variant: "destructive",
      });
    },
  });
};
