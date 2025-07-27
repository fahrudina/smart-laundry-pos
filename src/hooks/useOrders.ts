import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  service_name: string;
  service_price: number;
  quantity: number;
  line_total: number;
  estimated_completion?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  execution_status: string;
  payment_status: string;
  payment_method?: string;
  payment_amount?: number;
  payment_notes?: string;
  execution_notes?: string;
  created_at: string;
  order_date?: string;
  estimated_completion?: string;
  order_items: OrderItem[];
}

interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  items: {
    service_name: string;
    service_price: number;
    quantity: number;
    estimated_completion?: string;
  }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  execution_status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_amount?: number;
  payment_notes?: string;
  order_date?: string;
  estimated_completion?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrder = async (orderData: CreateOrderData) => {
    setLoading(true);
    try {
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
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Order processed successfully",
      });

      return order;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process order",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAllOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            service_name,
            service_price,
            quantity,
            line_total,
            estimated_completion
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByCustomer = async (customerPhone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            service_name,
            service_price,
            quantity,
            line_total
          )
        `)
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer orders",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (
    orderId: string, 
    paymentStatus: string,
    paymentMethod?: string,
    paymentAmount?: number,
    paymentNotes?: string
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_amount: paymentAmount,
          payment_notes: paymentNotes,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

      // Refresh orders
      await getAllOrders();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateExecutionStatus = async (
    orderId: string,
    executionStatus: string,
    executionNotes?: string
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          execution_status: executionStatus,
          execution_notes: executionNotes,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Execution status updated successfully",
      });

      // Refresh orders
      await getAllOrders();
    } catch (error: any) {
      console.error('Error updating execution status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update execution status",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    createOrder,
    getAllOrders,
    getOrdersByCustomer,
    updatePaymentStatus,
    updateExecutionStatus,
  };
};
