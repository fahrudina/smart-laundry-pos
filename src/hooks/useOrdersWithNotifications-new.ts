import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppDataHelper } from '@/integrations/whatsapp/data-helper';
import { OrderCreatedData, OrderCompletedData } from '@/integrations/whatsapp/types';
import type { CreateOrderData, UnitItem } from './useOrdersOptimized';

// Re-export types for convenience
export type { CreateOrderData, UnitItem };

const ORDERS_QUERY_KEY = ['orders'];

export const useCreateOrderWithNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyOrderCreated } = useWhatsApp();
  const { currentStore } = useStore();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      // First, insert the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
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
          store_id: currentStore?.store_id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Then insert order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        service_name: item.service_name,
        service_price: item.service_price,
        quantity: item.quantity,
        line_total: item.service_price * item.quantity,
        service_type: item.service_type,
        weight_kg: item.weight_kg,
        unit_items: item.unit_items,
        estimated_completion: item.estimated_completion,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send WhatsApp notification (non-blocking)
      // We don't await this to avoid blocking the order creation
      (async () => {
        try {
          const storeInfo = await WhatsAppDataHelper.getStoreInfo(currentStore?.store_id);
          const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.items);
          
          const notificationData: OrderCreatedData = {
            orderId: order.id,
            customerName: orderData.customer_name,
            totalAmount: orderData.total_amount,
            subtotal: orderData.subtotal,
            estimatedCompletion: WhatsAppDataHelper.formatEstimatedCompletion(orderData.estimated_completion),
            paymentStatus: orderData.payment_status || 'pending',
            orderItems,
            storeInfo,
          };

          await notifyOrderCreated(orderData.customer_phone, notificationData);
        } catch (error) {
          // Log WhatsApp notification errors but don't fail the order
          console.warn('WhatsApp notification failed:', error);
        }
      })();

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
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOrderStatusWithNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyOrderCompleted } = useWhatsApp();
  const { currentStore } = useStore();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      executionStatus, 
      paymentStatus,
      paymentMethod,
      paymentAmount,
      paymentNotes,
      executionNotes,
    }: {
      orderId: string;
      executionStatus?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      paymentAmount?: number;
      paymentNotes?: string;
      executionNotes?: string;
    }) => {
      // Fetch current order data for WhatsApp notification
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            service_name,
            service_price,
            quantity,
            line_total,
            service_type,
            weight_kg
          )
        `)
        .eq('id', orderId)
        .single();

      // Update the order status
      const updateData: any = {};
      if (executionStatus !== undefined) updateData.execution_status = executionStatus;
      if (paymentStatus !== undefined) updateData.payment_status = paymentStatus;
      if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
      if (paymentAmount !== undefined) updateData.payment_amount = paymentAmount;
      if (paymentNotes !== undefined) updateData.payment_notes = paymentNotes;
      if (executionNotes !== undefined) updateData.execution_notes = executionNotes;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Send WhatsApp notification for completed orders
      if (executionStatus === 'completed' && orderData) {
        (async () => {
          try {
            const storeInfo = await WhatsAppDataHelper.getStoreInfo(currentStore?.store_id);
            const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.order_items || []);
            
            const notificationData: OrderCompletedData = {
              orderId: orderId,
              customerName: orderData.customer_name,
              totalAmount: orderData.total_amount,
              completedAt: WhatsAppDataHelper.formatCompletionDate(new Date().toISOString()),
              orderItems,
              storeInfo,
            };

            await notifyOrderCompleted(orderData.customer_phone, notificationData);
          } catch (error) {
            // Log WhatsApp notification errors but don't fail the status update
            console.warn('WhatsApp notification failed:', error);
          }
        })();
      }

      return { orderId, executionStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });
};
