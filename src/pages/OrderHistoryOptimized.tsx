import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Search, Eye, Filter, Calendar, AlertTriangle, Edit, X, ChevronDown, ArrowLeft, Home, RefreshCw, Printer, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useNavigate } from 'react-router-dom';
import { useOrders, OrderFilters, Order } from '@/hooks/useOrdersOptimized';
import { useUpdateOrderStatusWithNotifications } from '@/hooks/useOrdersWithNotifications';
import { OrderDetailsDialog } from '@/components/pos/OrderDetailsDialog';
import { CashPaymentDialog } from '@/components/pos/CashPaymentDialog';
import { ThermalPrintDialog } from '@/components/thermal/ThermalPrintDialog';
import { VirtualizedOrderList } from '@/components/orders/VirtualizedOrderList';
import { PaymentSummaryCards } from '@/components/orders/PaymentSummaryCards';
import { PayLaterPaymentDialog } from '@/components/orders/PayLaterPaymentDialog';
import { formatDate, isDateOverdue } from '@/lib/utils';
import { openReceiptForView, openReceiptForPrint, generateReceiptPDFFromUrl, sanitizeFilename } from '@/lib/printUtils';
import { usePageTitle, updatePageTitleWithCount } from '@/hooks/usePageTitle';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { SectionLoading, InlineLoading } from '@/components/ui/loading-spinner';

interface FilterState {
  executionStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  dateRange: string;
  isOverdue: boolean;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export const OrderHistory = () => {
  const navigate = useNavigate();
  usePageTitle('Riwayat Pesanan');
  const { isOwner } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCashPaymentDialog, setShowCashPaymentDialog] = useState(false);
  const [showThermalPrintDialog, setShowThermalPrintDialog] = useState(false);
  const [showPayLaterPaymentDialog, setShowPayLaterPaymentDialog] = useState(false);
  const [cashPaymentOrder, setCashPaymentOrder] = useState<Order | null>(null);
  const [thermalPrintOrder, setThermalPrintOrder] = useState<Order | null>(null);
  const [payLaterPaymentOrder, setPayLaterPaymentOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    executionStatus: 'all',
    paymentStatus: 'all',
    paymentMethod: 'all',
    dateRange: 'today', // Default to today for better performance on initial load
    isOverdue: false,
  });
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  
  // Pending filters (before Apply button is clicked)
  const [pendingFilters, setPendingFilters] = useState<FilterState>({
    executionStatus: 'all',
    paymentStatus: 'all',
    paymentMethod: 'all',
    dateRange: 'today', // Default to today for better performance on initial load
    isOverdue: false,
  });
  const [pendingCustomDateRange, setPendingCustomDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<SortState>({
    field: 'created_at',
    direction: 'desc',
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if there are at least 2 characters or search is empty
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to calculate date range for server-side filtering
  const getDateRangeForFilter = useCallback((dateRangeType: string, customRange?: DateRange): { from?: string; to?: string } => {
    const now = new Date();
    
    switch (dateRangeType) {
      case 'today': {
        const from = startOfDay(now);
        const to = endOfDay(now);
        return { from: from.toISOString(), to: to.toISOString() };
      }
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        const from = startOfDay(yesterday);
        const to = endOfDay(yesterday);
        return { from: from.toISOString(), to: to.toISOString() };
      }
      case 'week': {
        const weekAgo = subDays(now, 7);
        const from = startOfDay(weekAgo);
        const to = endOfDay(now);
        return { from: from.toISOString(), to: to.toISOString() };
      }
      case 'month': {
        const monthAgo = subMonths(now, 1);
        const from = startOfDay(monthAgo);
        const to = endOfDay(now);
        return { from: from.toISOString(), to: to.toISOString() };
      }
      case 'custom': {
        if (customRange?.from) {
          const from = startOfDay(customRange.from);
          const to = customRange.to ? endOfDay(customRange.to) : endOfDay(customRange.from);
          return { from: from.toISOString(), to: to.toISOString() };
        }
        return {};
      }
      case 'all':
      default:
        // No date filtering - return empty object to fetch all orders
        return {};
    }
  }, []);

  // Memoize query filters to prevent unnecessary re-renders
  const queryFilters = useMemo<OrderFilters>(() => {
    const dateRange = getDateRangeForFilter(filters.dateRange, customDateRange);
    return {
      executionStatus: filters.executionStatus !== 'all' ? filters.executionStatus : undefined,
      paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
      paymentMethod: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
      searchTerm: debouncedSearchTerm.trim() || undefined,
      dateRangeFrom: dateRange.from,
      dateRangeTo: dateRange.to,
    };
  }, [filters.executionStatus, filters.paymentStatus, filters.paymentMethod, filters.dateRange, customDateRange, debouncedSearchTerm, getDateRangeForFilter]);

  // Use optimized hooks
  const { 
    orders, 
    loading, 
    hasMore, 
    totalCount,
    loadMore,
    refresh,
    isRefreshing
  } = useOrders(queryFilters);

  const updateOrderMutation = useUpdateOrderStatusWithNotifications();

  // Enhanced filtering function with sorting (client-side for complex filters)
  // Note: Date range filtering is now handled server-side for better performance
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Overdue filter (client-side only)
      if (filters.isOverdue && !isOrderOverdue(order)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting logic
      let aValue: any;
      let bValue: any;

      switch (sortBy.field) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'customer_name':
          aValue = a.customer_name.toLowerCase();
          bValue = b.customer_name.toLowerCase();
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'execution_status':
          aValue = a.execution_status;
          bValue = b.execution_status;
          break;
        case 'payment_status':
          aValue = a.payment_status;
          bValue = b.payment_status;
          break;
        case 'estimated_completion':
          aValue = a.estimated_completion ? new Date(a.estimated_completion) : new Date(0);
          bValue = b.estimated_completion ? new Date(b.estimated_completion) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, filters, sortBy]);

  // Apply pending filters
  const applyFilters = useCallback(() => {
    setFilters(pendingFilters);
    setCustomDateRange(pendingCustomDateRange);
    setShowFilters(false);
  }, [pendingFilters, pendingCustomDateRange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      executionStatus: 'all',
      paymentStatus: 'all',
      paymentMethod: 'all',
      dateRange: 'all',
      isOverdue: false,
    };
    setFilters(clearedFilters);
    setPendingFilters(clearedFilters);
    setCustomDateRange(undefined);
    setPendingCustomDateRange(undefined);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortBy({
      field: 'created_at',
      direction: 'desc',
    });
    // Refresh orders when clearing filters
    refresh();
  }, [refresh]);

  // Sync pending filters when filter panel opens
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
      setPendingCustomDateRange(customDateRange);
    }
  }, [showFilters, filters, customDateRange]);

  // Check if any filters are active
  const hasActiveFilters = 
    (filters.executionStatus && filters.executionStatus !== 'all') ||
    (filters.paymentStatus && filters.paymentStatus !== 'all') ||
    (filters.paymentMethod && filters.paymentMethod !== 'all') ||
    (filters.dateRange && filters.dateRange !== 'all') ||
    filters.isOverdue ||
    debouncedSearchTerm.trim().length > 0 ||
    (customDateRange?.from !== undefined);

  // Update page title with order count
  useEffect(() => {
    if (debouncedSearchTerm) {
      updatePageTitleWithCount(`Search: "${debouncedSearchTerm}"`, filteredOrders.length);
    } else if (hasActiveFilters) {
      updatePageTitleWithCount('Filtered Orders', filteredOrders.length);
    } else {
      updatePageTitleWithCount('Order History', totalCount);
    }
  }, [debouncedSearchTerm, filteredOrders.length, totalCount, hasActiveFilters]);

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ready_for_pickup': return 'bg-emerald-100 text-emerald-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'in_queue': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'down_payment': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodDisplay = (method: string | null) => {
    if (!method) return '-';
    switch (method) {
      case 'cash': return 'Cash';
      case 'qris': return 'QRIS';
      case 'transfer': return 'Transfer';
      default: return method;
    }
  };

  const isOrderOverdue = (order: Order) => {
    return order.estimated_completion && 
           order.execution_status !== 'completed' && 
           order.execution_status !== 'ready_for_pickup' && 
           isDateOverdue(order.estimated_completion);
  };

  const handleUpdateExecutionStatus = useCallback(async (orderId: string, status: string) => {
    updateOrderMutation.mutate({
      orderId,
      executionStatus: status,
    });
  }, [updateOrderMutation]);

  const handleUpdatePaymentStatus = useCallback(async (orderId: string, status: string, method?: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // If payment method is cash and status is completed, show cash payment dialog
    if (method === 'cash' && status === 'completed') {
      setCashPaymentOrder(order || null);
      setShowCashPaymentDialog(true);
      return;
    }
    
    // For other payment methods, process directly with points and notifications
    updateOrderMutation.mutate({
      orderId,
      paymentStatus: status,
      paymentMethod: method,
      paymentAmount: order?.total_amount,
    });
  }, [updateOrderMutation, orders]);

  const handleCashPaymentSubmit = useCallback(async (cashReceived: number) => {
    if (!cashPaymentOrder) return;
    
    updateOrderMutation.mutate({
      orderId: cashPaymentOrder.id,
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      paymentAmount: cashPaymentOrder.total_amount,
      cashReceived: cashReceived,
    });
    
    // Close the dialog and clear state
    setShowCashPaymentDialog(false);
    setCashPaymentOrder(null);
  }, [updateOrderMutation, cashPaymentOrder]);

  // Handler to show the PayLaterPaymentDialog
  const handleShowPaymentDialog = useCallback((order: Order) => {
    setPayLaterPaymentOrder(order);
    setShowPayLaterPaymentDialog(true);
  }, []);

  // Handler for PayLaterPaymentDialog submission
  const handlePayLaterPaymentSubmit = useCallback(async (data: {
    paymentMethod: string;
    cashReceived?: number;
    pointsRedeemed?: number;
    discountAmount?: number;
  }) => {
    if (!payLaterPaymentOrder) return;
    
    // Calculate the amount to be paid
    // For down_payment status, we need to pay the remaining balance
    const totalAmount = payLaterPaymentOrder.total_amount - (data.discountAmount || 0);
    const remainingBalance = payLaterPaymentOrder.payment_status === 'down_payment' 
      ? totalAmount - (payLaterPaymentOrder.payment_amount || 0)
      : totalAmount;
    
    updateOrderMutation.mutate({
      orderId: payLaterPaymentOrder.id,
      paymentStatus: 'completed',
      paymentMethod: data.paymentMethod,
      paymentAmount: totalAmount, // Full amount after discount
      cashReceived: data.cashReceived,
      pointsRedeemed: data.pointsRedeemed,
      discountAmount: data.discountAmount,
    });
    
    // Close the dialog and clear state
    setShowPayLaterPaymentDialog(false);
    setPayLaterPaymentOrder(null);
  }, [updateOrderMutation, payLaterPaymentOrder]);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  const handleViewReceipt = useCallback((orderId: string) => {
    openReceiptForView(orderId);
  }, []);

  const handlePrintReceipt = useCallback((orderId: string) => {
    openReceiptForPrint(orderId);
  }, []);

  const handleThermalPrint = useCallback((orderId: string) => {
    const order = filteredOrders.find(o => o.id === orderId);
    setThermalPrintOrder(order || null);
    setShowThermalPrintDialog(true);
  }, [filteredOrders]);

  const handleExportReceiptPDF = useCallback(async (orderId: string, customerName: string) => {
    try {
      toast.loading('Generating PDF...', { id: `pdf-${orderId}` });
      await generateReceiptPDFFromUrl(orderId, {
        filename: `receipt-${sanitizeFilename(customerName)}-${orderId.slice(-6)}.pdf`
      });
      toast.success('PDF exported successfully!', { id: `pdf-${orderId}` });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.', { id: `pdf-${orderId}` });
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <div className="space-y-2 sm:space-y-6 lg:space-y-8">
        {/* Mobile-First Page Header */}
        <div className="bg-white border-b px-2 py-2 sm:px-6 sm:py-3 lg:px-8 sm:bg-transparent sm:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Riwayat Pesanan</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Kelola dan lacak semua pesanan pelanggan
                </p>
              </div>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading || isRefreshing}
                className="p-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading || isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Pesanan Baru</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile-Optimized Search and Filters */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between mb-4 sm:mb-6">
              {/* Search Bar - Full Width on Mobile */}
              <div className="relative order-2 sm:order-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama pelanggan, telepon, atau ID pesanan (min 2 karakter)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setDebouncedSearchTerm('');
                    }}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {searchTerm !== debouncedSearchTerm && (
                  <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                    Mencari...
                  </div>
                )}
              </div>

              {/* Filter Button */}
              <div className="order-1 sm:order-2">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full sm:w-auto ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                          {Object.values(filters).filter(Boolean).length + (debouncedSearchTerm ? 1 : 0)}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-screen max-w-sm sm:w-80" align="end" side="bottom">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filter</h4>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Hapus Semua
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status Eksekusi</label>
                      <Select
                        value={pendingFilters.executionStatus}
                        onValueChange={(value) => setPendingFilters(prev => ({ ...prev, executionStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="in_queue">Dalam Antrian</SelectItem>
                          <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                          <SelectItem value="ready_for_pickup">Siap Diambil</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Status Pembayaran</label>
                      <Select
                        value={pendingFilters.paymentStatus}
                        onValueChange={(value) => setPendingFilters(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="pending">Menunggu</SelectItem>
                          <SelectItem value="down_payment">DP</SelectItem>
                          <SelectItem value="completed">Lunas</SelectItem>
                          <SelectItem value="refunded">Dikembalikan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Metode Pembayaran</label>
                      <Select
                        value={pendingFilters.paymentMethod}
                        onValueChange={(value) => setPendingFilters(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Metode</SelectItem>
                          <SelectItem value="cash">Tunai</SelectItem>
                          <SelectItem value="qris">QRIS</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Rentang Tanggal</label>
                      <Select
                        value={pendingFilters.dateRange}
                        onValueChange={(value) => {
                          setPendingFilters(prev => ({ ...prev, dateRange: value }));
                          // Clear custom date range when switching to predefined option
                          if (value !== 'custom') {
                            setPendingCustomDateRange(undefined);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Waktu</SelectItem>
                          <SelectItem value="today">Hari Ini</SelectItem>
                          <SelectItem value="yesterday">Kemarin</SelectItem>
                          <SelectItem value="week">Minggu Ini</SelectItem>
                          <SelectItem value="month">Bulan Ini</SelectItem>
                          <SelectItem value="custom">Rentang Khusus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Date Range Picker - shown when custom is selected */}
                    {pendingFilters.dateRange === 'custom' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Pilih Rentang Tanggal</label>
                        <DateRangePicker
                          date={pendingCustomDateRange}
                          onDateChange={setPendingCustomDateRange}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="overdue"
                        checked={pendingFilters.isOverdue}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, isOverdue: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="overdue" className="text-sm font-medium">
                        Tampilkan hanya pesanan terlambat
                      </label>
                    </div>
                  </div>
                      
                      {/* Apply Button */}
                      <div className="pt-3 border-t">
                        <Button
                          onClick={applyFilters}
                          className="w-full"
                        >
                          Terapkan Filter
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Payment Summary Cards - Owner Only */}
            {isOwner && <PaymentSummaryCards orders={filteredOrders} />}

            {/* Mobile-Optimized Orders List */}
            <Card>
              {/* <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-lg sm:text-xl">Order History ({totalCount} total)</span>
                  </CardTitle>
                </div>
              </CardHeader> */}
              <CardContent className="p-2 sm:p-6">
                {loading && filteredOrders.length === 0 ? (
                  <SectionLoading text="Memuat pesanan..." />
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Tidak ada pesanan ditemukan</h3>
                    <p className="text-muted-foreground mb-4">
                      {hasActiveFilters
                        ? "Coba sesuaikan filter atau kata kunci pencarian"
                        : "Belum ada pesanan yang dibuat"}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters}>
                        Hapus Filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-4">
                    {/* Use Virtualized List for better performance with responsive height */}
                    <VirtualizedOrderList
                      orders={filteredOrders}
                      onOrderClick={handleViewOrder}
                      onUpdatePayment={handleUpdatePaymentStatus}
                      onUpdateExecution={handleUpdateExecutionStatus}
                      onShowPaymentDialog={handleShowPaymentDialog}
                      onViewReceipt={handleViewReceipt}
                      onPrintReceipt={handlePrintReceipt}
                      onPrintThermal={handleThermalPrint}
                      onExportReceiptPDF={handleExportReceiptPDF}
                      height={500} // Fixed responsive height
                    />
                  </div>
                )}

                {/* Load More Button */}
                {filteredOrders.length > 0 && hasMore && (
                  <div className="flex justify-center mt-4 sm:mt-6 mb-2 sm:mb-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-8 py-2"
                    >
                      {loading ? (
                        <InlineLoading text="Memuat..." />
                      ) : (
                        'Muat Lebih Banyak Pesanan'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Summary */}
                {filteredOrders.length > 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-4 mb-4">
                    Menampilkan {filteredOrders.length} dari {totalCount} pesanan
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Details Dialog */}
        {selectedOrder && (
          <OrderDetailsDialog
            order={selectedOrder}
            isOpen={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
          />
        )}

        {/* Cash Payment Dialog */}
        {cashPaymentOrder && (
          <CashPaymentDialog
            isOpen={showCashPaymentDialog}
            onClose={() => {
              setShowCashPaymentDialog(false);
              setCashPaymentOrder(null);
            }}
            totalAmount={cashPaymentOrder.total_amount}
            onSubmit={handleCashPaymentSubmit}
          />
        )}

        {/* Thermal Print Dialog */}
        <ThermalPrintDialog
          isOpen={showThermalPrintDialog}
          onClose={() => {
            setShowThermalPrintDialog(false);
            setThermalPrintOrder(null);
          }}
          orderId={thermalPrintOrder?.id || null}
          customerName={thermalPrintOrder?.customer_name}
        />

        {/* Pay Later Payment Dialog */}
        {payLaterPaymentOrder && (
          <PayLaterPaymentDialog
            isOpen={showPayLaterPaymentDialog}
            onClose={() => {
              setShowPayLaterPaymentDialog(false);
              setPayLaterPaymentOrder(null);
            }}
            totalAmount={
              payLaterPaymentOrder.payment_status === 'down_payment' 
                ? payLaterPaymentOrder.total_amount - (payLaterPaymentOrder.payment_amount || 0)
                : payLaterPaymentOrder.total_amount
            }
            customerPhone={payLaterPaymentOrder.customer_phone}
            customerName={payLaterPaymentOrder.customer_name}
            orderId={payLaterPaymentOrder.id}
            onSubmit={handlePayLaterPaymentSubmit}
          />
        )}
      </div>
    </div>
  );
};
