import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
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
  store_id?: string;
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
    service_type?: 'unit' | 'kilo' | 'combined';
    weight_kg?: number;
    unit_items?: any[];
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
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { currentStore } = useStore();
  const { toast } = useToast();

  const createOrder = async (orderData: CreateOrderData) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

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

  const getAllOrders = async (reset: boolean = false) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const pageSize = 10;
      const page = reset ? 0 : currentPage;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Build the query with proper ordering and store filtering
      let query = supabase
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
        `, { count: 'exact' })
        .eq('store_id', currentStore.store_id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (reset) {
        setOrders(data || []);
        setCurrentPage(1);
      } else {
        setOrders(prev => [...prev, ...(data || [])]);
        setCurrentPage(prev => prev + 1);
      }

      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === pageSize && (page + 1) * pageSize < (count || 0));
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

  const loadMoreOrders = async () => {
    if (!hasMore || loading) return;
    await getAllOrders(false);
  };

  const refreshOrders = async () => {
    setCurrentPage(0);
    setHasMore(true);
    await getAllOrders(true);
  };

  const getOrdersByCustomer = async (customerPhone: string) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

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
        .eq('store_id', currentStore.store_id)
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
      await refreshOrders();
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
      await refreshOrders();
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
    hasMore,
    currentPage,
    totalCount,
    createOrder,
    getAllOrders,
    loadMoreOrders,
    refreshOrders,
    getOrdersByCustomer,
    updatePaymentStatus,
    updateExecutionStatus,
  };
};
