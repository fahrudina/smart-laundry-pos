import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

interface OrderFilters {
  executionStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  searchTerm?: string;
}

const ORDERS_QUERY_KEY = ['orders'];
const PAGE_SIZE = 10;

// Fetch orders with infinite query for pagination
export const useOrdersInfinite = (filters?: OrderFilters) => {
  return useInfiniteQuery({
    queryKey: [...ORDERS_QUERY_KEY, 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

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
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);

      // Apply filters if provided
      if (filters?.executionStatus && filters.executionStatus !== 'all') {
        query = query.eq('execution_status', filters.executionStatus);
      }
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters?.searchTerm) {
        query = query.or(`customer_name.ilike.%${filters.searchTerm}%,customer_phone.ilike.%${filters.searchTerm}%,id.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        nextCursor: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        hasMore: data && data.length === PAGE_SIZE && (pageParam + 1) * PAGE_SIZE < (count || 0),
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for order data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all orders (for backward compatibility)
export const useOrders = (filters?: OrderFilters) => {
  const infiniteQuery = useOrdersInfinite(filters);
  
  const orders = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const totalCount = infiniteQuery.data?.pages[0]?.count || 0;
  const hasMore = infiniteQuery.hasNextPage || false;
  
  return {
    orders,
    loading: infiniteQuery.isLoading || infiniteQuery.isFetchingNextPage,
    hasMore,
    totalCount,
    error: infiniteQuery.error,
    loadMore: infiniteQuery.fetchNextPage,
    refresh: infiniteQuery.refetch,
    isRefreshing: infiniteQuery.isRefetching,
  };
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
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

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      paymentStatus, 
      paymentMethod, 
      paymentAmount, 
      paymentNotes 
    }: {
      orderId: string;
      paymentStatus: string;
      paymentMethod?: string;
      paymentAmount?: number;
      paymentNotes?: string;
    }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });
};

// Update execution status mutation
export const useUpdateExecutionStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      executionStatus,
      executionNotes
    }: {
      orderId: string;
      executionStatus: string;
      executionNotes?: string;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          execution_status: executionStatus,
          execution_notes: executionNotes,
        })
        .eq('id', orderId);

      if (error) throw error;
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

// Get orders by customer
export const useOrdersByCustomer = (customerPhone: string) => {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, 'customer', customerPhone],
    queryFn: async () => {
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
    },
    enabled: !!customerPhone,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export type { Order, OrderItem, CreateOrderData, OrderFilters };
