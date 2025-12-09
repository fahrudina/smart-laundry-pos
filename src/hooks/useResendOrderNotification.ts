import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppDataHelper } from '@/integrations/whatsapp/data-helper';
import { OrderCreatedData } from '@/integrations/whatsapp/types';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';

/**
 * Custom hook to resend order created WhatsApp notification
 * Fetches complete order details and resends the notification
 */
export const useResendOrderNotification = () => {
  const [isResending, setIsResending] = useState(false);
  const { notifyOrderCreated } = useWhatsApp();
  const { toast } = useToast();
  const { currentStore } = useStore();

  const resendNotification = async (orderId: string) => {
    setIsResending(true);
    
    try {
      // Fetch complete order details with order items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            service_name,
            service_type,
            service_price,
            quantity,
            weight_kg,
            line_total
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Failed to fetch order details');
      }

      // Get store info from context
      const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(currentStore);
      
      // Format order items for WhatsApp notification
      const orderItems = WhatsAppDataHelper.formatOrderItems(order.order_items || []);
      
      // Prepare notification data
      const notificationData: OrderCreatedData = {
        orderId: order.id,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        subtotal: order.subtotal,
        estimatedCompletion: WhatsAppDataHelper.formatEstimatedCompletion(order.estimated_completion),
        paymentStatus: order.payment_status || 'pending',
        orderItems,
        storeInfo,
        pointsEarned: order.points_earned || undefined,
        pointsRedeemed: order.points_redeemed || undefined,
        discountAmount: order.discount_amount || undefined,
      };

      // Send WhatsApp notification
      const result = await notifyOrderCreated(order.customer_phone, notificationData);

      if (result.success) {
        toast({
          title: "Notification Resent",
          description: `WhatsApp notification resent to ${order.customer_phone}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }

      return { success: true };
    } catch (error) {
      console.error('Error resending notification:', error);
      toast({
        title: "Failed to Resend",
        description: error instanceof Error ? error.message : 'Failed to resend WhatsApp notification',
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsResending(false);
    }
  };

  return {
    resendNotification,
    isResending,
  };
};
