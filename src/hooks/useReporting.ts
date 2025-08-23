import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';

export interface ReportingMetrics {
  periodRevenue: {
    amount: number;
    changeFromPrevious: number;
  };
  activeServiceTickets: {
    count: number;
    changeFromPrevious: number;
  };
  customersServed: {
    count: number;
    changeFromPrevious: number;
  };
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface ReportOrder {
  id: string;
  customer_name: string;
  service_type: string;
  weight_kg?: number;
  execution_status: string;
  total_amount: number;
  created_at: string;
}

export interface ServiceDistribution {
  service_name: string;
  count: number;
  revenue: number;
}

export interface InventoryStatus {
  item: string;
  level: number;
  status: 'low' | 'medium' | 'high';
}

interface DateRange {
  from: Date;
  to: Date;
}

export const useReporting = (dateRange: DateRange) => {
  const [metrics, setMetrics] = useState<ReportingMetrics | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { currentStore } = useStore();
  const { toast } = useToast();

  const fetchReportingData = async () => {
    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No store selected"
      });
      return;
    }

    setLoading(true);
    try {
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      // Calculate previous period for comparison
      const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousFromDate = new Date(dateRange.from);
      previousFromDate.setDate(previousFromDate.getDate() - periodDays);
      const previousToDate = new Date(dateRange.from);

      // Fetch orders for current and previous periods
      const [currentOrdersResult, previousOrdersResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              service_name,
              service_price,
              quantity,
              line_total,
              weight_kg
            )
          `)
          .eq('store_id', currentStore.store_id)
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('orders')
          .select('total_amount, customer_name, execution_status')
          .eq('store_id', currentStore.store_id)
          .gte('created_at', previousFromDate.toISOString())
          .lt('created_at', fromDate)
      ]);

      if (currentOrdersResult.error) throw currentOrdersResult.error;
      if (previousOrdersResult.error) throw previousOrdersResult.error;

      const currentOrders = currentOrdersResult.data || [];
      const previousOrders = previousOrdersResult.data || [];

      // Calculate metrics
      const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      const activeTickets = currentOrders.filter(order => 
        ['in_queue', 'in_progress', 'processing'].includes(order.execution_status)
      ).length;
      
      const previousActiveTickets = previousOrders.filter(order => 
        ['in_queue', 'in_progress', 'processing'].includes(order.execution_status)
      ).length;

      const currentCustomers = new Set(currentOrders.map(order => order.customer_name)).size;
      const previousCustomers = new Set(previousOrders.map(order => order.customer_name)).size;

      // Calculate percentage changes
      const revenueChange = previousRevenue === 0 
        ? (currentRevenue > 0 ? 100 : 0)
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      const ticketsChange = previousActiveTickets === 0 
        ? (activeTickets > 0 ? 100 : 0)
        : ((activeTickets - previousActiveTickets) / previousActiveTickets) * 100;

      const customersChange = previousCustomers === 0 
        ? (currentCustomers > 0 ? 100 : 0)
        : ((currentCustomers - previousCustomers) / previousCustomers) * 100;

      const reportingMetrics: ReportingMetrics = {
        periodRevenue: {
          amount: currentRevenue,
          changeFromPrevious: Math.round(revenueChange)
        },
        activeServiceTickets: {
          count: activeTickets,
          changeFromPrevious: Math.round(ticketsChange)
        },
        customersServed: {
          count: currentCustomers,
          changeFromPrevious: Math.round(customersChange)
        }
      };

      // Process daily revenue data for chart
      const dailyRevenueMap = new Map<string, number>();
      
      currentOrders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const current = dailyRevenueMap.get(date) || 0;
        dailyRevenueMap.set(date, current + (order.total_amount || 0));
      });

      const dailyRevenueData: DailyRevenue[] = Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Process orders for table
      const formattedOrders: ReportOrder[] = currentOrders.map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        service_type: (order.order_items as any)?.[0]?.service_name || 'Multiple Services',
        weight_kg: (order.order_items as any)?.[0]?.weight_kg,
        execution_status: order.execution_status,
        total_amount: order.total_amount,
        created_at: order.created_at
      }));

      // Process service distribution
      const serviceMap = new Map<string, { count: number; revenue: number }>();
      
      currentOrders.forEach(order => {
        (order.order_items as any)?.forEach((item: any) => {
          const current = serviceMap.get(item.service_name) || { count: 0, revenue: 0 };
          serviceMap.set(item.service_name, {
            count: current.count + (item.quantity || 1),
            revenue: current.revenue + (item.line_total || 0)
          });
        });
      });

      const serviceDistributionData: ServiceDistribution[] = Array.from(serviceMap.entries()).map(([service_name, data]) => ({
        service_name,
        count: data.count,
        revenue: data.revenue
      }));

      // Mock inventory data - in real implementation, this would come from an inventory table
      const inventoryData: InventoryStatus[] = [
        { item: 'Detergent', level: 75, status: 'high' },
        { item: 'Fabric Softener', level: 45, status: 'medium' },
        { item: 'Bleach', level: 20, status: 'low' }
      ];

      setMetrics(reportingMetrics);
      setDailyRevenue(dailyRevenueData);
      setOrders(formattedOrders);
      setServiceDistribution(serviceDistributionData);
      setInventoryStatus(inventoryData);

    } catch (error) {
      console.error('Error fetching reporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reporting data. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportingData();
  }, [currentStore, dateRange.from, dateRange.to]);

  const refreshData = () => {
    fetchReportingData();
  };

  return {
    metrics,
    dailyRevenue,
    orders,
    serviceDistribution,
    inventoryStatus,
    loading,
    refreshData
  };
};