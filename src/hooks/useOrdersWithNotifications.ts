import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppDataHelper } from '@/integrations/whatsapp/data-helper';
import { OrderCreatedData, OrderCompletedData, OrderReadyForPickupData } from '@/integrations/whatsapp/types';
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
          cash_received: orderData.cash_received,
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
        quantity: Math.ceil(item.quantity),
        line_total: item.service_price * item.quantity,
        service_type: item.service_type,
        weight_kg: item.weight_kg,
        unit_items: item.service_type === 'kilo' ? 0 : item.unit_items,
        estimated_completion: item.estimated_completion,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Calculate and award points if payment is successful
      let pointsEarned = 0;
      if (orderData.payment_status === 'paid') {
        // Calculate points from order items
        orderData.items.forEach(item => {
          if (item.service_type === 'kilo' && item.weight_kg) {
            // 1 point per kg (rounded)
            pointsEarned += Math.round(item.weight_kg);
          } else if (item.service_type === 'unit') {
            // 1 point per unit
            pointsEarned += Math.ceil(item.quantity);
          } else if (item.service_type === 'combined') {
            // For combined, count both weight and units
            if (item.weight_kg) {
              pointsEarned += Math.round(item.weight_kg);
            }
            pointsEarned += Math.ceil(item.quantity);
          }
        });

        if (pointsEarned > 0) {
          // Update order with points earned
          await supabase
            .from('orders')
            .update({ points_earned: pointsEarned })
            .eq('id', order.id);

          // Update customer points
          const { data: existingPoints } = await supabase
            .from('customer_points')
            .select('total_points')
            .eq('customer_phone', orderData.customer_phone)
            .eq('store_id', currentStore?.store_id)
            .single();

          if (existingPoints) {
            // Add to existing points
            await supabase
              .from('customer_points')
              .update({ 
                total_points: existingPoints.total_points + pointsEarned,
                updated_at: new Date().toISOString(),
              })
              .eq('customer_phone', orderData.customer_phone)
              .eq('store_id', currentStore?.store_id);
          } else {
            // Create new customer points record
            await supabase
              .from('customer_points')
              .insert({
                customer_phone: orderData.customer_phone,
                total_points: pointsEarned,
                store_id: currentStore?.store_id,
              });
          }
        }
      }

      // Send WhatsApp notification (non-blocking)
      // We don't await this to avoid blocking the order creation
      (async () => {
        try {
          // Use store context data directly instead of querying by ID
          const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
          const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.items);
          
          console.log('🏪 Current store context:', currentStore);
          console.log('📋 Store info for notification:', storeInfo);
          console.log('🎁 Points earned:', pointsEarned);
          
          const notificationData: OrderCreatedData = {
            orderId: order.id,
            customerName: orderData.customer_name,
            totalAmount: orderData.total_amount,
            subtotal: orderData.subtotal,
            estimatedCompletion: WhatsAppDataHelper.formatEstimatedCompletion(orderData.estimated_completion),
            paymentStatus: orderData.payment_status || 'pending',
            orderItems,
            storeInfo,
            pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
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
  const { notifyOrderReadyForPickup } = useWhatsApp();
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
      // if (executionStatus === 'completed' && orderData) {
      //   (async () => {
      //     try {
      //       // Use store context data directly instead of querying by ID
      //       const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
      //       const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.order_items || []);
            
      //       console.log('🏪 Current store context for completion:', currentStore);
      //       console.log('📋 Store info for completion notification:', storeInfo);
            
      //       const notificationData: OrderCompletedData = {
      //         orderId: orderId,
      //         customerName: orderData.customer_name,
      //         totalAmount: orderData.total_amount,
      //         completedAt: WhatsAppDataHelper.formatCompletionDate(new Date().toISOString()),
      //         orderItems,
      //         storeInfo,
      //       };

      //       await notifyOrderCompleted(orderData.customer_phone, notificationData);
      //     } catch (error) {
      //       // Log WhatsApp notification errors but don't fail the status update
      //       console.warn('WhatsApp notification failed:', error);
      //     }
      //   })();
      // }

      // Send WhatsApp notification for ready for pickup orders
      if (executionStatus === 'ready_for_pickup' && orderData) {
        (async () => {
          try {
            // Use store context data directly instead of querying by ID
            const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
            const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.order_items || []);
            
            console.log('🏪 Current store context for ready for pickup:', currentStore);
            console.log('📋 Store info for ready for pickup notification:', storeInfo);
            
            const notificationData: OrderReadyForPickupData = {
              orderId: orderId,
              customerName: orderData.customer_name,
              totalAmount: orderData.total_amount,
              readyAt: WhatsAppDataHelper.formatCompletionDate(new Date().toISOString()),
              orderItems,
              storeInfo,
              paymentStatus: orderData.payment_status,
            };

            await notifyOrderReadyForPickup(orderData.customer_phone, notificationData);
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
