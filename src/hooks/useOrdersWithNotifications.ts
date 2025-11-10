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
          discount_amount: orderData.discount_amount || 0,
          points_redeemed: orderData.points_redeemed || 0,
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

      // Deduct points if customer redeemed points for discount
      if (orderData.points_redeemed && orderData.points_redeemed > 0 && currentStore?.enable_points) {
        const { data: existingPoints, error: pointsError } = await supabase
          .from('points')
          .select('point_id, current_points')
          .eq('customer_phone', orderData.customer_phone)
          .eq('store_id', currentStore?.store_id)
          .single();

        if (pointsError || !existingPoints) {
          throw new Error('Customer points not found');
        }

        if (existingPoints.current_points < orderData.points_redeemed) {
          throw new Error('Insufficient points');
        }

        // Deduct points
        await supabase
          .from('points')
          .update({
            current_points: existingPoints.current_points - orderData.points_redeemed,
            updated_at: new Date().toISOString(),
          })
          .eq('point_id', existingPoints.point_id);

        // Create point transaction record for redemption
        await supabase
          .from('point_transactions')
          .insert({
            point_id: existingPoints.point_id,
            order_id: order.id,
            points_changed: -orderData.points_redeemed,
            transaction_type: 'redemption',
            transaction_date: new Date().toISOString(),
            notes: `Points redeemed for order ${order.id.slice(0, 8)} (Rp${orderData.discount_amount} discount)`,
          });
      }

      // Calculate and award points if payment is successful AND store has points enabled
      let pointsEarned = 0;
      if (orderData.payment_status === 'completed' && currentStore?.enable_points) {
        // Calculate points from the orderItems that were actually inserted
        orderItems.forEach(item => {
          if (item.service_type === 'kilo' && item.weight_kg) {
            // 1 point per kg (rounded)
            pointsEarned += Math.round(item.weight_kg);
          } else if (item.service_type === 'unit') {
            // 1 point per unit (quantity is already rounded up at line 52)
            pointsEarned += item.quantity;
          } else if (item.service_type === 'combined') {
            // For combined, count both weight and units
            if (item.weight_kg) {
              pointsEarned += Math.round(item.weight_kg);
            }
            pointsEarned += item.quantity;
          }
        });

        if (pointsEarned > 0) {
          // Update order with points earned
          await supabase
            .from('orders')
            .update({ points_earned: pointsEarned })
            .eq('id', order.id);

          // Update points table (existing table in the database)
          const { data: existingPoints } = await supabase
            .from('points')
            .select('point_id, accumulated_points, current_points')
            .eq('customer_phone', orderData.customer_phone)
            .eq('store_id', currentStore?.store_id)
            .single();

          let pointId: number;

          if (existingPoints) {
            // Add to existing points
            await supabase
              .from('points')
              .update({ 
                accumulated_points: existingPoints.accumulated_points + pointsEarned,
                current_points: existingPoints.current_points + pointsEarned,
                updated_at: new Date().toISOString(),
              })
              .eq('point_id', existingPoints.point_id);
            
            pointId = existingPoints.point_id;
          } else {
            // Create new customer points record
            const { data: newPoint } = await supabase
              .from('points')
              .insert({
                customer_phone: orderData.customer_phone,
                accumulated_points: pointsEarned,
                current_points: pointsEarned,
                store_id: currentStore?.store_id,
              })
              .select('point_id')
              .single();
            
            pointId = newPoint?.point_id;
          }

          // Create point transaction record for earning points
          if (pointId) {
            await supabase
              .from('point_transactions')
              .insert({
                point_id: pointId,
                order_id: order.id,
                points_changed: pointsEarned,
                transaction_type: 'earning',
                transaction_date: new Date().toISOString(),
                notes: `Points earned from order ${order.id.slice(0, 8)}`,
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

      // Return order with points earned information
      return {
        ...order,
        points_earned: pointsEarned,
      };
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
  const { notifyOrderReadyForPickup, notifyOrderCreated } = useWhatsApp();
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
            weight_kg,
            unit_items
          )
        `)
        .eq('id', orderId)
        .single();

      // Explicitly check if orderData exists, throw if not found
      if (!orderData) {
        throw new Error('Order not found');
      }

      // Calculate and award points if payment is being changed to "completed" AND store has points enabled
      let pointsEarned = 0;
      const wasPaymentPending = orderData.payment_status === 'pending';
      const isPaymentCompleted = paymentStatus === 'completed';

      if (wasPaymentPending && isPaymentCompleted && currentStore?.enable_points && orderData) {
        // Calculate points from the order items
        orderData.order_items?.forEach((item: any) => {
          if (item.service_type === 'kilo' && item.weight_kg) {
            // 1 point per kg (rounded)
            pointsEarned += Math.round(item.weight_kg);
          } else if (item.service_type === 'unit') {
            // 1 point per unit
            pointsEarned += item.quantity;
          } else if (item.service_type === 'combined') {
            // For combined, count both weight and units
            if (item.weight_kg) {
              pointsEarned += Math.round(item.weight_kg);
            }
            pointsEarned += item.quantity;
          }
        });

        if (pointsEarned > 0) {
          // Update points table
          const { data: existingPoints } = await supabase
            .from('points')
            .select('point_id, accumulated_points, current_points')
            .eq('customer_phone', orderData.customer_phone)
            .eq('store_id', currentStore?.store_id)
            .single();

          let pointId: number;

          if (existingPoints) {
            // Add to existing points
            await supabase
              .from('points')
              .update({
                accumulated_points: existingPoints.accumulated_points + pointsEarned,
                current_points: existingPoints.current_points + pointsEarned,
                updated_at: new Date().toISOString(),
              })
              .eq('point_id', existingPoints.point_id);

            pointId = existingPoints.point_id;
          } else {
            // Create new customer points record
            const { data: newPoint } = await supabase
              .from('points')
              .insert({
                customer_phone: orderData.customer_phone,
                accumulated_points: pointsEarned,
                current_points: pointsEarned,
                store_id: currentStore?.store_id,
              })
              .select('point_id')
              .single();

            pointId = newPoint?.point_id;
          }

          // Create point transaction record for earning points
          if (pointId) {
            await supabase
              .from('point_transactions')
              .insert({
                point_id: pointId,
                order_id: orderId,
                points_changed: pointsEarned,
                transaction_type: 'earning',
                transaction_date: new Date().toISOString(),
                notes: `Points earned from order ${orderId.slice(0, 8)}`,
              });
          }
        }
      }

      // Update the order status
      const updateData: any = {};
      if (executionStatus !== undefined) updateData.execution_status = executionStatus;
      if (paymentStatus !== undefined) updateData.payment_status = paymentStatus;
      if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
      if (paymentAmount !== undefined) updateData.payment_amount = paymentAmount;
      if (paymentNotes !== undefined) updateData.payment_notes = paymentNotes;
      if (executionNotes !== undefined) updateData.execution_notes = executionNotes;
      if (pointsEarned > 0) updateData.points_earned = pointsEarned;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Send WhatsApp notification when payment is completed with points earned
      if (wasPaymentPending && isPaymentCompleted && pointsEarned > 0 && orderData) {
        (async () => {
          try {
            // Use store context data directly instead of querying by ID
            const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
            const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.order_items || []);

            const notificationData: OrderCreatedData = {
              orderId: orderId,
              customerName: orderData.customer_name,
              totalAmount: orderData.total_amount,
              subtotal: orderData.subtotal,
              estimatedCompletion: WhatsAppDataHelper.formatEstimatedCompletion(orderData.estimated_completion),
              paymentStatus: 'completed',
              orderItems,
              storeInfo,
              pointsEarned: pointsEarned,
            };

            await notifyOrderCreated(orderData.customer_phone, notificationData);
          } catch (error) {
            // Log WhatsApp notification errors but don't fail the status update
            console.warn('WhatsApp notification failed:', error);
          }
        })();
      }

      // Send WhatsApp notification for ready for pickup orders
      if (executionStatus === 'ready_for_pickup' && orderData) {
        (async () => {
          try {
            // Use store context data directly instead of querying by ID
            const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
            const orderItems = WhatsAppDataHelper.formatOrderItems(orderData.order_items || []);


            const notificationData: OrderReadyForPickupData = {
              orderId: orderId,
              customerName: orderData.customer_name,
              totalAmount: orderData.total_amount,
              readyAt: WhatsAppDataHelper.formatCompletionDate(new Date().toISOString()),
              orderItems,
              storeInfo,
              paymentStatus: paymentStatus || orderData.payment_status,
            };

            await notifyOrderReadyForPickup(orderData.customer_phone, notificationData);
          } catch (error) {
            // Log WhatsApp notification errors but don't fail the status update
            console.warn('WhatsApp notification failed:', error);
          }
        })();
      }

      return { orderId, executionStatus, pointsEarned };
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
