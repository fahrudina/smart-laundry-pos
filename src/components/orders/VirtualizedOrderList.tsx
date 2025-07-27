import React, { memo, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Order } from '@/hooks/useOrdersOptimized';

interface VirtualizedOrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdatePayment: (orderId: string, status: string, method?: string) => void;
  onUpdateExecution: (orderId: string, status: string) => void;
  height: number;
}

interface ItemData {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdatePayment: (orderId: string, status: string, method?: string) => void;
  onUpdateExecution: (orderId: string, status: string) => void;
}

const OrderItem = memo(({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: ItemData;
}) => {
  const { orders, onOrderClick, onUpdatePayment, onUpdateExecution } = data;
  const order = orders[index];

  if (!order) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={style} className="px-2 sm:px-4">
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base sm:text-lg truncate">{order.customer_name}</h3>
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 ml-2 flex-shrink-0">
                  <Badge className={`${getExecutionStatusColor(order.execution_status)} text-xs`}>
                    <span className="hidden sm:inline">{order.execution_status.replace('_', ' ')}</span>
                    <span className="sm:hidden">
                      {order.execution_status === 'in_queue' ? '⏳' : 
                       order.execution_status === 'in_progress' ? '🔄' : 
                       order.execution_status === 'completed' ? '✅' : 
                       order.execution_status === 'cancelled' ? '❌' : ''}
                    </span>
                  </Badge>
                  <Badge className={`${getPaymentStatusColor(order.payment_status)} text-xs`}>
                    <span className="hidden sm:inline">{order.payment_status.replace('_', ' ')}</span>
                    <span className="sm:hidden">
                      {order.payment_status === 'completed' ? '💳' : 
                       order.payment_status === 'pending' ? '⏳' : 
                       order.payment_status === 'down_payment' ? '💰' : '❌'}
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                <div className="truncate">
                  <span className="font-medium">Phone: </span>
                  {order.customer_phone}
                </div>
                <div className="truncate">
                  <span className="font-medium">Order ID: </span>
                  {order.id.slice(-8)}
                </div>
                <div className="truncate">
                  <span className="font-medium">Created: </span>
                  {formatDate(order.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                <div>
                  <span className="font-medium">Items: </span>
                  {order.order_items?.length || 0} items
                </div>
                <div>
                  <span className="font-medium">Total: </span>
                  <span className="font-bold text-primary text-lg">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Mobile-optimized Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOrderClick(order)}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">View Details</span>
                </Button>

                {/* Execution Status Actions - Simplified for mobile */}
                {order.execution_status === 'in_queue' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'in_progress')}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Start Processing</span>
                    <span className="sm:hidden">🔄 Start</span>
                  </Button>
                )}
                {order.execution_status === 'in_progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'completed')}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Mark Complete</span>
                    <span className="sm:hidden">✅ Complete</span>
                  </Button>
                )}

                {/* Payment Status Actions - Simplified for mobile */}
                {order.payment_status === 'pending' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePayment(order.id, 'completed', 'cash')}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Cash Payment</span>
                      <span className="sm:hidden">💵</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePayment(order.id, 'completed', 'qris')}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">QRIS Payment</span>
                      <span className="sm:hidden">📱</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

export const VirtualizedOrderList: React.FC<VirtualizedOrderListProps> = ({
  orders,
  onOrderClick,
  onUpdatePayment,
  onUpdateExecution,
  height
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const itemData: ItemData = {
    orders,
    onOrderClick,
    onUpdatePayment,
    onUpdateExecution,
  };

  // Responsive item size - larger on mobile for better touch interaction
  const itemSize = isMobile ? 300 : 220;

  return (
    <List
      height={height}
      width="100%"
      itemCount={orders.length}
      itemSize={itemSize}
      itemData={itemData}
      overscanCount={5} // Render 5 extra items outside visible area for smoother scrolling
    >
      {OrderItem}
    </List>
  );
};
