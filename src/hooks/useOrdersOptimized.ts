import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';

interface UnitItem {
  item_name: string;
  quantity: number;
  price_per_unit: number;
}

interface OrderItem {
  service_name: string;
  service_price: number;
  quantity: number;
  line_total: number;
  estimated_completion?: string;
  service_type: 'unit' | 'kilo' | 'combined';
  weight_kg?: number;
  unit_items?: UnitItem[];
  category?: string;
  item_type?: 'service' | 'product';
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
    service_type: 'unit' | 'kilo' | 'combined';
    weight_kg?: number;
    unit_items?: UnitItem[];
    category?: string;
    item_type?: 'service' | 'product';
  }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  discount_amount?: number;
  points_redeemed?: number;
  execution_status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_amount?: number;
  cash_received?: number;
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
  const { currentStore } = useStore();

  return useInfiniteQuery({
    queryKey: [...ORDERS_QUERY_KEY, 'infinite', filters, currentStore?.store_id],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        if (!currentStore) {
          return { data: [], count: 0, nextCursor: null, hasNextPage: false };
        }

        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;


        // First, try a simple query without joins to test basic connectivity
        const { data: testData, error: testError } = await supabase
          .from('orders')
          .select('id, customer_name, customer_phone, created_at')
          .eq('store_id', currentStore.store_id)
          .limit(1);


        if (testError) {
          console.error('Test query failed:', testError);
          throw testError;
        }

        // If test query works, proceed with full query
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              service_name,
              service_price,
              quantity,
              line_total,
              estimated_completion,
              service_type,
              weight_kg,
              unit_items
            )
          `, { count: 'exact' })
          .eq('store_id', currentStore.store_id)
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
          // Search in customer name, phone, order ID with case-insensitive matching
          const searchPattern = filters.searchTerm.toLowerCase().trim();
          
          // Build comprehensive phone search patterns
          let phoneSearchQueries = [`customer_phone.ilike.%${searchPattern}%`];
          
          // If search contains only digits, create multiple phone format variations
          const digitsOnly = searchPattern.replace(/\D/g, '');
          if (digitsOnly.length > 0) {
            // Try various Indonesian phone number formats
            const variations = [
              digitsOnly,                    // Raw digits: 811234567
              `0${digitsOnly}`,             // With leading zero: 0811234567
              `+62${digitsOnly}`,           // With country code: +62811234567
              `62${digitsOnly}`,            // Country code without +: 62811234567
              `0${digitsOnly.substring(2)}`, // Remove first two digits and add 0: 0811234567 from 62811234567
              digitsOnly.substring(2),       // Remove first two digits: 811234567 from 62811234567
            ];
            
            // Add formatted versions with spaces, dashes, etc.
            variations.forEach(variation => {
              phoneSearchQueries.push(`customer_phone.ilike.%${variation}%`);
              // Also try with common separators
              if (variation.length > 3) {
                const formatted1 = `${variation.substring(0, 4)} ${variation.substring(4)}`;
                const formatted2 = `${variation.substring(0, 4)}-${variation.substring(4)}`;
                phoneSearchQueries.push(`customer_phone.ilike.%${formatted1}%`);
                phoneSearchQueries.push(`customer_phone.ilike.%${formatted2}%`);
              }
            });
          }
          
          // If search starts with 0, also try with +62 instead
          if (searchPattern.startsWith('0')) {
            const withCountryCode = `+62${searchPattern.substring(1)}`;
            const withCountryCodeNoPlus = `62${searchPattern.substring(1)}`;
            phoneSearchQueries.push(`customer_phone.ilike.%${withCountryCode}%`);
            phoneSearchQueries.push(`customer_phone.ilike.%${withCountryCodeNoPlus}%`);
          }
          
          // If search starts with +62 or 62, also try with 0 instead
          if (searchPattern.startsWith('+62')) {
            const withZero = `0${searchPattern.substring(3)}`;
            phoneSearchQueries.push(`customer_phone.ilike.%${withZero}%`);
          } else if (searchPattern.startsWith('62') && digitsOnly === searchPattern) {
            const withZero = `0${searchPattern.substring(2)}`;
            phoneSearchQueries.push(`customer_phone.ilike.%${withZero}%`);
          }
          
          // Remove duplicates
          phoneSearchQueries = [...new Set(phoneSearchQueries)];
          
          const searchQuery = [
            `customer_name.ilike.%${searchPattern}%`,
            ...phoneSearchQueries
          ].join(',');
          
          query = query.or(searchQuery);
        }

        const { data, error, count } = await query;
        
        
        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }

        return {
          data: data || [],
          count: count || 0,
          nextCursor: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
          hasMore: data && data.length === PAGE_SIZE && (pageParam + 1) * PAGE_SIZE < (count || 0),
        };
      } catch (error) {
        console.error('Query failed:', error);
        throw error;
      }
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
  const { currentStore } = useStore();

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
        quantity: Math.ceil(item.quantity),
        line_total: item.service_price * item.quantity,
        estimated_completion: item.estimated_completion,
        service_type: item.service_type || 'unit',
        weight_kg: item.weight_kg,
        unit_items: item.service_type === 'kilo' ? 0 : item.unit_items,
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
      paymentNotes,
      cashReceived
    }: {
      orderId: string;
      paymentStatus: string;
      paymentMethod?: string;
      paymentAmount?: number;
      paymentNotes?: string;
      cashReceived?: number;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_amount: paymentAmount,
          payment_notes: paymentNotes,
          cash_received: cashReceived,
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
  const { currentStore } = useStore();

  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, 'customer', customerPhone, currentStore?.store_id],
    queryFn: async () => {
      if (!currentStore) {
        return [];
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            service_name,
            service_price,
            quantity,
            line_total,
            estimated_completion,
            service_type,
            weight_kg,
            unit_items
          )
        `)
        .eq('customer_phone', customerPhone)
        .eq('store_id', currentStore.store_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerPhone && !!currentStore,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export type { Order, OrderItem, UnitItem, CreateOrderData, OrderFilters };
