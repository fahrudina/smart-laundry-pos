import React from 'react';
import { X, Calendar, User, Phone, CreditCard, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDateLong, isDateOverdue } from '@/lib/utils';

interface OrderDetailsDialogProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  isOpen,
  onClose,
}) => {
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
    if (!method) return 'Not specified';
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

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Order #{order.id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-muted-foreground flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDateLong(order.created_at)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getExecutionStatusColor(order.execution_status)}>
                Execution: {order.execution_status}
              </Badge>
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                Payment: {order.payment_status}
              </Badge>
              {isOrderOverdue(order) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </h3>
              <p className="text-muted-foreground">{order.customer_name}</p>
              <p className="text-muted-foreground flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {order.customer_phone}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </h3>
              <div className="space-y-1">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Drop-off: </span>
                  <span className="text-sm">
                    {order.order_date ? formatDateLong(order.order_date) : formatDateLong(order.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Est. Completion: </span>
                  <span className={`text-sm ${isOrderOverdue(order) ? 'text-red-600 font-medium' : ''}`}>
                    {order.estimated_completion ? formatDateLong(order.estimated_completion) : 'Not specified'}
                  </span>
                  {isOrderOverdue(order) && (
                    <AlertTriangle className="h-3 w-3 inline ml-1 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status: </span>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Method: </span>
                  <span className="text-sm">{getPaymentMethodDisplay(order.payment_method)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Total Amount: </span>
                  <span className="text-lg font-bold text-primary">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
                {order.payment_amount && order.payment_amount !== order.total_amount && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Amount Paid: </span>
                    <span className="text-lg font-semibold text-green-600">
                      ${order.payment_amount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {order.payment_notes && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Notes: </span>
                <p className="text-sm">{order.payment_notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.service_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ${item.service_price.toFixed(2)} × {item.quantity}
                    </p>
                    {item.estimated_completion && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ready by: {formatDateLong(item.estimated_completion)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax:</span>
              <span>${order.tax_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
