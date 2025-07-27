import React, { memo } from 'react';
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
    <div style={style} className="px-2">
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                <div className="flex space-x-2">
                  <Badge className={getExecutionStatusColor(order.execution_status)}>
                    {order.execution_status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {order.payment_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                <div>
                  <span className="font-medium">Phone: </span>
                  {order.customer_phone}
                </div>
                <div>
                  <span className="font-medium">Order ID: </span>
                  {order.id.slice(-8)}
                </div>
                <div>
                  <span className="font-medium">Created: </span>
                  {formatDate(order.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOrderClick(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>

                {/* Execution Status Actions */}
                {order.execution_status === 'in_queue' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'in_progress')}
                  >
                    Start Processing
                  </Button>
                )}
                {order.execution_status === 'in_progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'completed')}
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
                      onClick={() => onUpdatePayment(order.id, 'completed', 'cash')}
                    >
                      Cash Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePayment(order.id, 'completed', 'qris')}
                    >
                      QRIS Payment
                    </Button>
                  </>
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
  const itemData: ItemData = {
    orders,
    onOrderClick,
    onUpdatePayment,
    onUpdateExecution,
  };

  return (
    <List
      height={height}
      width="100%"
      itemCount={orders.length}
      itemSize={200} // Increased height to accommodate all content
      itemData={itemData}
      overscanCount={5} // Render 5 extra items outside visible area for smoother scrolling
    >
      {OrderItem}
    </List>
  );
};
