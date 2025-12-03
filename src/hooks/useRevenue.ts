import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from './use-toast';

// Expense data interface
export interface ExpenseData {
  id: string;
  store_id: string;
  category: 'detergent' | 'gas' | 'electricity' | 'promo' | 'maintenance' | 'other';
  description?: string;
  amount: number;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

// Form data for creating expenses
export interface ExpenseFormData {
  category: 'detergent' | 'gas' | 'electricity' | 'promo' | 'maintenance' | 'other';
  description?: string;
  amount: number;
  expense_date: string;
}

// Revenue summary interface
export interface RevenueSummary {
  grossProfit: number;
  totalDeductions: number;
  netProfit: number;
  paymentMethods: {
    cash: number;
    qris: number;
    transfer: number;
  };
  deductions: {
    detergent: number;
    gas: number;
    electricity: number;
    promo: number;
    maintenance: number;
    other: number;
  };
}

// Hook to fetch revenue summary for a date range
export const useRevenueSummary = (startDate: string, endDate: string) => {
  const { currentStore } = useStore();
  
  return useQuery({
    queryKey: ['revenue-summary', currentStore?.store_id, startDate, endDate],
    queryFn: async (): Promise<RevenueSummary> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      try {
        // Fetch orders for gross profit calculation
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, payment_method')
          .eq('store_id', currentStore.store_id)
          .eq('payment_status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          throw ordersError;
        }

        // Fetch expenses for deductions
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('category, amount')
          .eq('store_id', currentStore.store_id)
          .gte('expense_date', startDate.split('T')[0])
          .lte('expense_date', endDate.split('T')[0]);

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
          throw expensesError;
        }

        // Calculate payment method breakdown
        const paymentMethods = {
          cash: 0,
          qris: 0,
          transfer: 0,
        };

        let grossProfit = 0;
        (orders || []).forEach((order) => {
          grossProfit += Number(order.total_amount || 0);
          const method = order.payment_method as 'cash' | 'qris' | 'transfer';
          if (method && paymentMethods[method] !== undefined) {
            paymentMethods[method] += Number(order.total_amount || 0);
          }
        });

        // Calculate deductions breakdown
        const deductions = {
          detergent: 0,
          gas: 0,
          electricity: 0,
          promo: 0,
          maintenance: 0,
          other: 0,
        };

        let totalDeductions = 0;
        (expenses || []).forEach((expense) => {
          const amount = Number(expense.amount || 0);
          totalDeductions += amount;
          const category = expense.category as keyof typeof deductions;
          if (deductions[category] !== undefined) {
            deductions[category] += amount;
          }
        });

        const netProfit = grossProfit - totalDeductions;

        return {
          grossProfit,
          totalDeductions,
          netProfit,
          paymentMethods,
          deductions,
        };
      } catch (error) {
        console.error('Error in useRevenueSummary:', error);
        throw error;
      }
    },
    enabled: !!currentStore?.store_id && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to fetch expenses for a date range
export const useExpenses = (startDate?: string, endDate?: string) => {
  const { currentStore } = useStore();
  
  return useQuery({
    queryKey: ['expenses', currentStore?.store_id, startDate, endDate],
    queryFn: async (): Promise<ExpenseData[]> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      try {
        let query = supabase
          .from('expenses')
          .select('*')
          .eq('store_id', currentStore.store_id)
          .order('expense_date', { ascending: false });

        if (startDate && endDate) {
          query = query
            .gte('expense_date', startDate)
            .lte('expense_date', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching expenses:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in useExpenses:', error);
        return [];
      }
    },
    enabled: !!currentStore?.store_id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to create a new expense
export const useCreateExpense = () => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseData: ExpenseFormData) => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          store_id: currentStore.store_id,
          ...expenseData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['today-expenses'] });
      toast({
        title: 'Berhasil',
        description: 'Pengeluaran berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menambahkan pengeluaran',
        variant: 'destructive',
      });
    },
  });
};

// Hook to update an expense
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExpenseFormData }) => {
      const { data: result, error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['today-expenses'] });
      toast({
        title: 'Berhasil',
        description: 'Pengeluaran berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal memperbarui pengeluaran',
        variant: 'destructive',
      });
    },
  });
};

// Hook to delete an expense
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['today-expenses'] });
      toast({
        title: 'Berhasil',
        description: 'Pengeluaran berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menghapus pengeluaran',
        variant: 'destructive',
      });
    },
  });
};

// Hook to fetch today's total expenses for dashboard
export const useTodayExpenses = () => {
  const { currentStore } = useStore();
  
  return useQuery({
    queryKey: ['today-expenses', currentStore?.store_id],
    queryFn: async (): Promise<number> => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('store_id', currentStore.store_id)
        .eq('expense_date', today);

      if (error) {
        console.error('Error fetching today expenses:', error);
        throw error;
      }

      const total = (data || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return total;
    },
    enabled: !!currentStore?.store_id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
