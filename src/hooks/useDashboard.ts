import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  todayOrders: {
    count: number;
    changeFromYesterday: number;
  };
  todayRevenue: {
    amount: number;
    changeFromYesterday: number;
  };
  todayCustomers: {
    count: number;
    changeFromYesterday: number;
  };
  pendingOrders: {
    count: number;
    needsAttention: boolean;
  };
}

interface RecentOrder {
  id: string;
  customer_name: string;
  service_type: string;
  execution_status: string;
  created_at: string;
  total_amount: number;
}

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStore();
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    if (!currentStore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      // Get yesterday's date range
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = todayStart;

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (todayError) throw todayError;

      // Fetch yesterday's orders
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      if (yesterdayError) throw yesterdayError;

      // Fetch today's unique customers
      const { data: todayCustomers, error: customersError } = await supabase
        .from('orders')
        .select('customer_phone')
        .eq('store_id', currentStore.store_id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (customersError) throw customersError;

      // Fetch yesterday's unique customers
      const { data: yesterdayCustomers, error: yesterdayCustomersError } = await supabase
        .from('orders')
        .select('customer_phone')
        .eq('store_id', currentStore.store_id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      if (yesterdayCustomersError) throw yesterdayCustomersError;

      // Fetch pending orders
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .in('execution_status', ['pending', 'processing']);

      if (pendingError) throw pendingError;

      // Fetch recent orders (last 10)
      const { data: recentOrdersData, error: recentError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          execution_status,
          created_at,
          total_amount,
          order_items(service_name)
        `)
        .eq('store_id', currentStore.store_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Calculate metrics
      const todayOrdersCount = todayOrders?.length || 0;
      const yesterdayOrdersCount = yesterdayOrders?.length || 0;
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      const uniqueTodayCustomers = new Set(todayCustomers?.map(c => c.customer_phone)).size;
      const uniqueYesterdayCustomers = new Set(yesterdayCustomers?.map(c => c.customer_phone)).size;
      
      const pendingCount = pendingOrders?.length || 0;

      // Calculate percentage changes
      const ordersChange = yesterdayOrdersCount === 0 
        ? (todayOrdersCount > 0 ? 100 : 0)
        : ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100;

      const revenueChange = yesterdayRevenue === 0 
        ? (todayRevenue > 0 ? 100 : 0)
        : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

      const customersChange = uniqueYesterdayCustomers === 0 
        ? (uniqueTodayCustomers > 0 ? 100 : 0)
        : ((uniqueTodayCustomers - uniqueYesterdayCustomers) / uniqueYesterdayCustomers) * 100;

      const dashboardMetrics: DashboardMetrics = {
        todayOrders: {
          count: todayOrdersCount,
          changeFromYesterday: Math.round(ordersChange)
        },
        todayRevenue: {
          amount: todayRevenue,
          changeFromYesterday: Math.round(revenueChange)
        },
        todayCustomers: {
          count: uniqueTodayCustomers,
          changeFromYesterday: Math.round(customersChange)
        },
        pendingOrders: {
          count: pendingCount,
          needsAttention: pendingCount > 5 // Flag if more than 5 pending orders
        }
      };

      // Format recent orders
      const formattedRecentOrders = recentOrdersData?.map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        service_type: (order.order_items as any)?.[0]?.service_name || 'Multiple Services',
        execution_status: order.execution_status,
        created_at: order.created_at,
        total_amount: order.total_amount
      })) || [];

      setMetrics(dashboardMetrics);
      setRecentOrders(formattedRecentOrders);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentStore]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    metrics,
    recentOrders,
    loading,
    refreshData
  };
};
