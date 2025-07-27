import React, { useEffect, useState } from 'react';
import { Clock, Search, Eye, Filter, Calendar, AlertTriangle, Edit, X, ChevronDown, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/pos/OrderDetailsDialog';
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
  const { 
    orders, 
    loading, 
    hasMore, 
    totalCount,
    getAllOrders, 
    loadMoreOrders,
    refreshOrders,
    updatePaymentStatus, 
    updateExecutionStatus 
  } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
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

  useEffect(() => {
    refreshOrders();
  }, []);

  // Enhanced filtering function with sorting
  const filteredOrders = orders.filter(order => {
    // Text search
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Execution status filter
    if (filters.executionStatus && filters.executionStatus !== 'all' && order.execution_status !== filters.executionStatus) {
      return false;
    }

    // Payment status filter
    if (filters.paymentStatus && filters.paymentStatus !== 'all' && order.payment_status !== filters.paymentStatus) {
      return false;
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== 'all' && order.payment_method !== filters.paymentMethod) {
      return false;
    }

    // Date range filter
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

  // Clear all filters
  const clearFilters = () => {
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
    refreshOrders();
  };

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

  const handleUpdateExecutionStatus = async (orderId: string, status: string) => {
    try {
      await updateExecutionStatus(orderId, status);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string, method?: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await updatePaymentStatus(orderId, status, method, order?.total_amount);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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

      <div className="max-w-7xl mx-auto">
        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
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

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}>
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
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
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
                      <div className="flex space-x-2">
                        <Select
                          value={sortBy.field}
                          onValueChange={(value) => setSortBy(prev => ({ ...prev, field: value }))}
                        >
                          <SelectTrigger className="flex-1">
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
                          <SelectTrigger className="w-24">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters ? 'Filtered' : 'Total'} Orders
                  </p>
                  <p className="text-2xl font-bold">
                    {hasActiveFilters ? filteredOrders.length : orders.length}
                  </p>
                  {hasActiveFilters && (
                    <p className="text-xs text-muted-foreground">
                      of {orders.length} total
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters ? 'Filtered' : "Today's"} Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    ${(hasActiveFilters ? filteredOrders : orders)
                      .filter(order => hasActiveFilters || new Date(order.created_at).toDateString() === new Date().toDateString())
                      .reduce((sum, order) => sum + order.total_amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {(hasActiveFilters ? filteredOrders : orders)
                      .filter(order => order.execution_status === 'completed').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {(hasActiveFilters ? filteredOrders : orders)
                      .filter(order => order.execution_status === 'in_progress').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(hasActiveFilters ? filteredOrders : orders)
                      .filter(order => isOrderOverdue(order)).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {hasActiveFilters ? 'Filtered Orders' : 'Recent Orders'}
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredOrders.length} results)
                  </span>
                )}
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="font-semibold text-lg">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <div className="flex space-x-2">
                            <Badge className={getExecutionStatusColor(order.execution_status)}>
                              Execution: {order.execution_status}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.payment_status)}>
                              Payment: {order.payment_status}
                            </Badge>
                          </div>
                          {isOrderOverdue(order) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <span className="font-medium">Customer: </span>
                            {order.customer_name}
                          </div>
                          <div>
                            <span className="font-medium">Phone: </span>
                            {order.customer_phone}
                          </div>
                          <div>
                            <span className="font-medium">Payment Method: </span>
                            {getPaymentMethodDisplay(order.payment_method)}
                          </div>
                          <div>
                            <span className="font-medium">Drop-off: </span>
                            {order.order_date ? formatDate(order.order_date) : formatDate(order.created_at)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Est. Completion: </span>
                            {order.estimated_completion ? (
                              <span className={isOrderOverdue(order) ? 'text-red-600 font-medium' : ''}>
                                {formatDate(order.estimated_completion)}
                              </span>
                            ) : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Items: </span>
                            {order.order_items?.length || 0} items
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>

                          {/* Execution Status Actions */}
                          {order.execution_status === 'in_queue' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateExecutionStatus(order.id, 'in_progress')}
                            >
                              Start Processing
                            </Button>
                          )}
                          {order.execution_status === 'in_progress' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateExecutionStatus(order.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}

                          {/* Payment Status Actions */}
                          {order.payment_status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(order.id, 'completed', 'cash')}
                              >
                                Cash Payment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(order.id, 'completed', 'qris')}
                              >
                                QRIS Payment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(order.id, 'down_payment', 'cash')}
                              >
                                Down Payment
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-primary">
                          ${order.total_amount.toFixed(2)}
                        </p>
                        {order.payment_amount && order.payment_amount !== order.total_amount && (
                          <p className="text-sm text-muted-foreground">
                            Paid: ${order.payment_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
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
                  onClick={loadMoreOrders}
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

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
        />
      )}
    </div>
  );
};
