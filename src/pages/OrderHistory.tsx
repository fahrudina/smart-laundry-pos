import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Clock, Search, Eye, Filter, Calendar, AlertTriangle, Edit, X, ChevronDown, ArrowLeft, Home, RefreshCw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useOrders, useUpdatePaymentStatus, useUpdateExecutionStatus, OrderFilters } from '@/hooks/useOrdersOptimized';
import { OrderDetailsDialog } from '@/components/pos/OrderDetailsDialog';
import { VirtualizedOrderList } from '@/components/orders/VirtualizedOrderList';
import { formatDate, isDateOverdue } from '@/lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Memoize query filters to prevent unnecessary re-renders
  const queryFilters = useMemo<OrderFilters>(() => ({
    executionStatus: filters.executionStatus,
    paymentStatus: filters.paymentStatus,
    paymentMethod: filters.paymentMethod,
    searchTerm: searchTerm.trim(),
  }), [filters.executionStatus, filters.paymentStatus, filters.paymentMethod, searchTerm]);

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

  useEffect(() => {
    refresh();
  }, []);

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
    searchTerm.trim().length > 0;

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
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

  const isOrderOverdue = (order: any) => {
    return order.estimated_completion && 
           order.execution_status !== 'completed' && 
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
    updatePaymentMutation.mutate({
      orderId,
      paymentStatus: status,
      paymentMethod: method,
      paymentAmount: order?.total_amount,
    });
  }, [updatePaymentMutation, orders]);

  const handleViewOrder = useCallback((order: any) => {
    console.log('Viewing order:', order.id);
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <div className="space-y-4 md:space-y-8">
        {/* Mobile-First Page Header */}
        <div className="bg-white border-b px-4 py-3 md:px-0 md:py-0 md:bg-transparent md:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl md:text-3xl font-bold">Order History</h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Manage and track all customer orders
                </p>
              </div>
            </div>
            
            {/* Mobile Menu Toggle */}
            <div className="flex items-center space-x-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading || isRefreshing}
                className="p-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Header Actions */}
            <div className="hidden md:flex items-center space-x-2">
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

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="mt-3 pt-3 border-t md:hidden">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="default"
                  onClick={() => {
                    navigate('/');
                    setShowMobileMenu(false);
                  }}
                  className="justify-start"
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-0">
          {/* Mobile-Optimized Search and Filters */}
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between mb-6 md:mb-8">
            {/* Search Bar - Full Width on Mobile */}
            <div className="relative order-2 md:order-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-80"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter Button */}
            <div className="order-1 md:order-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full md:w-auto ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0)}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-sm md:w-80" align="end" side="bottom">
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
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="in_queue">In Queue</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
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
                            <SelectValue placeholder="All payment statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All payment statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="down_payment">Down Payment</SelectItem>
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
                            <SelectValue placeholder="All methods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All methods</SelectItem>
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
                            <SelectValue placeholder="All dates" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">Last 7 days</SelectItem>
                            <SelectItem value="month">Last 30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="overdue"
                          checked={filters.isOverdue}
                          onChange={(e) => setFilters(prev => ({ ...prev, isOverdue: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="overdue" className="text-sm font-medium">
                          Show only overdue orders
                        </label>
                      </div>

                      <div className="border-t pt-3">
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <div className="space-y-2 md:flex md:space-y-0 md:space-x-2">
                          <Select
                            value={sortBy.field}
                            onValueChange={(value) => setSortBy(prev => ({ ...prev, field: value }))}
                          >
                            <SelectTrigger className="w-full md:flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created_at">Date Created</SelectItem>
                              <SelectItem value="customer_name">Customer Name</SelectItem>
                              <SelectItem value="total_amount">Total Amount</SelectItem>
                              <SelectItem value="execution_status">Execution Status</SelectItem>
                              <SelectItem value="payment_status">Payment Status</SelectItem>
                              <SelectItem value="estimated_completion">Completion Date</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={sortBy.direction}
                            onValueChange={(value: 'asc' | 'desc') => setSortBy(prev => ({ ...prev, direction: value }))}
                          >
                            <SelectTrigger className="w-full md:w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="desc">↓ Desc</SelectItem>
                              <SelectItem value="asc">↑ Asc</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mobile-Optimized Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {hasActiveFilters ? 'Filtered' : 'Total'} Orders
                    </p>
                    <p className="text-lg md:text-2xl font-bold">
                      {hasActiveFilters ? filteredOrders.length : orders.length}
                    </p>
                    {hasActiveFilters && (
                      <p className="text-xs text-muted-foreground">
                        of {orders.length} total
                      </p>
                    )}
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Revenue
                    </p>
                    <p className="text-lg md:text-2xl font-bold">
                      Rp{(hasActiveFilters ? filteredOrders : orders)
                        .filter(order => hasActiveFilters || new Date(order.created_at).toDateString() === new Date().toDateString())
                        .reduce((sum, order) => sum + order.total_amount, 0)
                        .toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                    <p className="text-lg md:text-2xl font-bold">
                      {(hasActiveFilters ? filteredOrders : orders)
                        .filter(order => order.execution_status === 'completed').length}
                    </p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">In Progress</p>
                    <p className="text-lg md:text-2xl font-bold">
                      {(hasActiveFilters ? filteredOrders : orders)
                        .filter(order => order.execution_status === 'in_progress').length}
                    </p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Overdue</p>
                    <p className="text-lg md:text-2xl font-bold text-red-600">
                      {(hasActiveFilters ? filteredOrders : orders)
                        .filter(order => isOrderOverdue(order)).length}
                    </p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile-Optimized Orders List */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg md:text-xl">
                  {hasActiveFilters ? 'Filtered Orders' : 'Recent Orders'}
                  {hasActiveFilters && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({filteredOrders.length} results)
                    </span>
                  )}
                </CardTitle>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="hidden md:flex">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="md:hidden w-full mt-2">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  {hasActiveFilters ? (
                    <div>
                      <p>No orders match your filters</p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters to see all orders
                      </Button>
                    </div>
                  ) : (
                    <p>No orders found</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  {filteredOrders.map((order, index) => (
                    <div
                      key={`order-${order.id}-${index}`}
                      className="order-card-mobile p-5 md:p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all bg-white mb-6 md:mb-8"
                    >
                      <div className="space-y-5 md:space-y-4">
                        {/* Mobile-First Order Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg md:text-xl truncate">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-blue-600">
                              Status: {order.execution_status} | Payment: {order.payment_status}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="text-xl md:text-2xl font-bold text-primary">
                              Rp{order.total_amount.toLocaleString('id-ID')}
                            </p>
                            {order.payment_amount && order.payment_amount !== order.total_amount && (
                              <p className="text-sm text-muted-foreground">
                                Paid: Rp{order.payment_amount.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getExecutionStatusColor(order.execution_status)} variant="secondary">
                            <span className="hidden sm:inline">{order.execution_status.replace('_', ' ')}</span>
                            <span className="sm:hidden">
                              {order.execution_status === 'in_queue' ? '⏳' : 
                               order.execution_status === 'in_progress' ? '🔄' : 
                               order.execution_status === 'completed' ? '✅' : 
                               order.execution_status === 'cancelled' ? '❌' : ''}
                            </span>
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.payment_status)} variant="secondary">
                            <span className="hidden sm:inline">{order.payment_status.replace('_', ' ')}</span>
                            <span className="sm:hidden">
                              {order.payment_status === 'completed' ? '💳' : 
                               order.payment_status === 'pending' ? '⏳' : 
                               order.payment_status === 'down_payment' ? '💰' : 
                               order.payment_status === 'refunded' ? '↩️' : ''}
                            </span>
                          </Badge>
                          {isOrderOverdue(order) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="hidden sm:inline">Overdue</span>
                              <span className="sm:hidden">!</span>
                            </Badge>
                          )}
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex justify-between md:block">
                            <span className="font-medium">Phone:</span>
                            <span className="md:block">{order.customer_phone}</span>
                          </div>
                          <div className="flex justify-between md:block">
                            <span className="font-medium">Payment:</span>
                            <span className="md:block">{getPaymentMethodDisplay(order.payment_method)}</span>
                          </div>
                          <div className="flex justify-between md:block">
                            <span className="font-medium">Drop-off:</span>
                            <span className="md:block">{order.order_date ? formatDate(order.order_date) : formatDate(order.created_at)}</span>
                          </div>
                          <div className="flex justify-between md:block">
                            <span className="font-medium">Est. Completion:</span>
                            <span className={`md:block ${isOrderOverdue(order) ? 'text-red-600 font-medium' : ''}`}>
                              {order.estimated_completion ? formatDate(order.estimated_completion) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* ALWAYS VISIBLE TEST SECTION */}
                        <div className="w-full bg-red-100 border-2 border-red-500 p-4 text-center">
                          <p className="text-red-800 font-bold">TEST: This should ALWAYS be visible!</p>
                          <p className="text-sm">Order: {order.id.slice(-8)} | Status: {order.execution_status}</p>
                          
                          {/* Simple Test Button */}
                          <button 
                            onClick={() => alert(`Test button clicked for order ${order.id}`)}
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '50px',
                              backgroundColor: 'blue',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              marginTop: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            🔴 TEST BUTTON - CLICK ME!
                          </button>
                          
                          <button 
                            onClick={() => {
                              console.log('View order clicked:', order.id);
                              handleViewOrder(order);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '50px',
                              backgroundColor: 'green',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              marginTop: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            👀 VIEW ORDER DETAILS
                          </button>
                        </div>

                        {/* Mobile-Optimized Action Buttons - Force Visible */}
                        <div className="button-container-mobile block w-full mt-4 space-y-3 border-t border-gray-200 pt-3 bg-gray-50 p-3 rounded-lg">
                          {/* View Details Button - Force Visible on Mobile */}
                          <div className="text-xs text-blue-600 mb-2 block md:hidden">
                            DEBUG: Mobile buttons section for Order #{order.id.slice(-8)}
                          </div>
                          <button
                            onClick={() => {
                              console.log(`Viewing order ${order.id} for ${order.customer_name}`);
                              handleViewOrder(order);
                            }}
                            className="mobile-button-fix !block !visible w-full h-12 px-4 py-2 bg-white border-2 border-blue-300 rounded-md text-sm font-medium text-gray-900 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <div className="flex items-center justify-center">
                              <Eye className="h-4 w-4 mr-2" />
                              👀 View Order Details
                            </div>
                          </button>

                          {/* Status Action Buttons */}
                          <div className="button-container-mobile block w-full space-y-2">
                            {order.execution_status === 'in_queue' && (
                              <button
                                onClick={() => {
                                  console.log(`Starting processing for order ${order.id}`);
                                  handleUpdateExecutionStatus(order.id, 'in_progress');
                                }}
                                className="mobile-button-fix !block !visible w-full h-10 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                              >
                                🚀 Start Processing
                              </button>
                            )}
                            
                            {order.execution_status === 'in_progress' && (
                              <button
                                onClick={() => {
                                  console.log(`Marking complete for order ${order.id}`);
                                  handleUpdateExecutionStatus(order.id, 'completed');
                                }}
                                className="mobile-button-fix !block !visible w-full h-10 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                              >
                                ✅ Mark Complete
                              </button>
                            )}
                            
                            {order.execution_status === 'completed' && (
                              <div className="block w-full h-10 px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium flex items-center justify-center">
                                ✅ Order Completed
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Actions - Force Visible on Mobile */}
                        {order.payment_status === 'pending' && (
                          <div className="button-container-mobile block w-full mt-3 space-y-3 border-t border-yellow-200 pt-3 bg-yellow-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-yellow-800 flex items-center">
                              💳 Payment Required - Choose Payment Method:
                            </div>
                            <div className="button-container-mobile block w-full space-y-2">
                              <button
                                onClick={() => {
                                  console.log(`Processing cash payment for order ${order.id}`);
                                  handleUpdatePaymentStatus(order.id, 'completed', 'cash');
                                }}
                                className="mobile-button-fix !block !visible w-full h-10 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                              >
                                💵 Pay with Cash
                              </button>
                              <button
                                onClick={() => {
                                  console.log(`Processing QRIS payment for order ${order.id}`);
                                  handleUpdatePaymentStatus(order.id, 'completed', 'qris');
                                }}
                                className="mobile-button-fix !block !visible w-full h-10 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                              >
                                📱 Pay with QRIS
                              </button>
                              <button
                                onClick={() => {
                                  console.log(`Processing down payment for order ${order.id}`);
                                  handleUpdatePaymentStatus(order.id, 'down_payment', 'cash');
                                }}
                                className="mobile-button-fix !block !visible w-full h-10 px-4 py-2 bg-white border-2 border-orange-400 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                              >
                                💰 Down Payment
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {order.payment_status === 'completed' && (
                          <div className="block w-full mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-800 flex items-center">
                              ✅ Payment Completed via {order.payment_method?.toUpperCase() || 'Unknown'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Load More Button */}
              {filteredOrders.length > 0 && hasMore && (
                <div className="flex justify-center mt-6 mb-4">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 md:px-8 py-2 w-full md:w-auto"
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

        {/* Order Details Dialog */}
        {selectedOrder && (
          <OrderDetailsDialog
            order={selectedOrder}
            isOpen={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
          />
        )}
      </div>
    </div>
  );
};
