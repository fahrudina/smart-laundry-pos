import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Search, Eye, Filter, Calendar, AlertTriangle, Edit, X, ChevronDown, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useOrders, useUpdatePaymentStatus, useUpdateExecutionStatus, OrderFilters, Order } from '@/hooks/useOrdersOptimized';
import { OrderDetailsDialog } from '@/components/pos/OrderDetailsDialog';
import { CashPaymentDialog } from '@/components/pos/CashPaymentDialog';
import { VirtualizedOrderList } from '@/components/orders/VirtualizedOrderList';
import { formatDate, isDateOverdue } from '@/lib/utils';
import { usePageTitle, updatePageTitleWithCount } from '@/hooks/usePageTitle';

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
  usePageTitle('Order History');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCashPaymentDialog, setShowCashPaymentDialog] = useState(false);
  const [cashPaymentOrder, setCashPaymentOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    executionStatus: 'all',
    paymentStatus: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    isOverdue: false,
  });
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

  // Memoize query filters to prevent unnecessary re-renders
  const queryFilters = useMemo<OrderFilters>(() => ({
    executionStatus: filters.executionStatus !== 'all' ? filters.executionStatus : undefined,
    paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
    paymentMethod: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
    searchTerm: debouncedSearchTerm.trim() || undefined,
  }), [filters.executionStatus, filters.paymentStatus, filters.paymentMethod, debouncedSearchTerm]);

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

  const updatePaymentMutation = useUpdatePaymentStatus();
  const updateExecutionMutation = useUpdateExecutionStatus();

  // Enhanced filtering function with sorting (client-side for complex filters)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date range filter (not handled by server)
      if (filters.dateRange && filters.dateRange !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (orderDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (orderDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (orderDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (orderDate < monthAgo) return false;
            break;
        }
      }

      // Overdue filter
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

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      executionStatus: 'all',
      paymentStatus: 'all',
      paymentMethod: 'all',
      dateRange: 'all',
      isOverdue: false,
    });
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortBy({
      field: 'created_at',
      direction: 'desc',
    });
    // Refresh orders when clearing filters
    refresh();
  }, [refresh]);

  // Check if any filters are active
  const hasActiveFilters = 
    (filters.executionStatus && filters.executionStatus !== 'all') ||
    (filters.paymentStatus && filters.paymentStatus !== 'all') ||
    (filters.paymentMethod && filters.paymentMethod !== 'all') ||
    (filters.dateRange && filters.dateRange !== 'all') ||
    filters.isOverdue ||
    debouncedSearchTerm.trim().length > 0;

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
    updateExecutionMutation.mutate({
      orderId,
      executionStatus: status,
    });
  }, [updateExecutionMutation]);

  const handleUpdatePaymentStatus = useCallback(async (orderId: string, status: string, method?: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // If payment method is cash and status is completed, show cash payment dialog
    if (method === 'cash' && status === 'completed') {
      setCashPaymentOrder(order || null);
      setShowCashPaymentDialog(true);
      return;
    }
    
    // For other payment methods, process directly
    updatePaymentMutation.mutate({
      orderId,
      paymentStatus: status,
      paymentMethod: method,
      paymentAmount: order?.total_amount,
    });
  }, [updatePaymentMutation, orders]);

  const handleCashPaymentSubmit = useCallback(async (cashReceived: number) => {
    if (!cashPaymentOrder) return;
    
    updatePaymentMutation.mutate({
      orderId: cashPaymentOrder.id,
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      paymentAmount: cashPaymentOrder.total_amount,
      cashReceived: cashReceived,
    });
    
    // Close the dialog and clear state
    setShowCashPaymentDialog(false);
    setCashPaymentOrder(null);
  }, [updatePaymentMutation, cashPaymentOrder]);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Mobile-First Page Header */}
        <div className="bg-white border-b px-4 py-3 sm:px-6 lg:px-8 sm:bg-transparent sm:border-0">
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Order History</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Manage and track all customer orders
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
                <span>Refresh</span>
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>New Order</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile-Optimized Search and Filters */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between mb-6">
              {/* Search Bar - Full Width on Mobile */}
              <div className="relative order-2 sm:order-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, phone, or order ID (min 2 chars)..."
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
                    Searching...
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
                      Filters
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
                        <h4 className="font-medium">Filters</h4>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear All
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Execution Status</label>
                      <Select
                        value={filters.executionStatus}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, executionStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="in_queue">In Queue</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Status</label>
                      <Select
                        value={filters.paymentStatus}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="down_payment">Down Payment</SelectItem>
                          <SelectItem value="completed">Paid</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Method</label>
                      <Select
                        value={filters.paymentMethod}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="qris">QRIS</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Date Range</label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="overdue"
                        checked={filters.isOverdue}
                        onChange={(e) => setFilters(prev => ({ ...prev, isOverdue: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="overdue" className="text-sm font-medium">
                        Show only overdue orders
                      </label>
                    </div>
                  </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Mobile-Optimized Orders List */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-lg sm:text-xl">Order History ({totalCount} total)</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {loading && filteredOrders.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {hasActiveFilters 
                        ? "Try adjusting your filters or search terms" 
                        : "No orders have been created yet"}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Use Virtualized List for better performance with responsive height */}
                    <VirtualizedOrderList
                      orders={filteredOrders}
                      onOrderClick={handleViewOrder}
                      onUpdatePayment={handleUpdatePaymentStatus}
                      onUpdateExecution={handleUpdateExecutionStatus}
                      height={500} // Fixed responsive height
                    />
                  </div>
                )}

                {/* Load More Button */}
                {filteredOrders.length > 0 && hasMore && (
                  <div className="flex justify-center mt-6 mb-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-8 py-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Orders'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Summary */}
                {filteredOrders.length > 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-4 mb-4">
                    Showing {filteredOrders.length} of {totalCount} orders
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
      </div>
    </div>
  );
};
