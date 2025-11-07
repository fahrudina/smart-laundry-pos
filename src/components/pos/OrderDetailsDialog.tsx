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
    if (!method) return 'Tidak ditentukan';
    switch (method) {
      case 'cash': return 'Tunai';
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
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg sm:text-xl">Detail Pesanan</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                Order #{order.id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-muted-foreground flex items-center mt-1 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDateLong(order.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getExecutionStatusColor(order.execution_status)}>
                <span className="hidden sm:inline">Eksekusi: </span>{order.execution_status}
              </Badge>
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                <span className="hidden sm:inline">Pembayaran: </span>{order.payment_status}
              </Badge>
              {isOrderOverdue(order) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Terlambat
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center text-base sm:text-lg">
                <User className="h-4 w-4 mr-2" />
                Informasi Pelanggan
              </h3>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm sm:text-base">{order.customer_name}</p>
                <p className="text-muted-foreground flex items-center text-sm sm:text-base">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.customer_phone}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center text-base sm:text-lg">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </h3>
              <div className="space-y-2">
                <div className="text-sm sm:text-base">
                  <span className="font-medium text-muted-foreground">Masuk: </span>
                  <span>
                    {order.order_date ? formatDateLong(order.order_date) : formatDateLong(order.created_at)}
                  </span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium text-muted-foreground">Est. Selesai: </span>
                  <span className={`${isOrderOverdue(order) ? 'text-red-600 font-medium' : ''}`}>
                    {order.estimated_completion ? formatDateLong(order.estimated_completion) : 'Tidak ditentukan'}
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
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold flex items-center text-base sm:text-lg">
              <CreditCard className="h-4 w-4 mr-2" />
              Informasi Pembayaran
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status: </span>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Metode: </span>
                  <span className="text-sm sm:text-base">{getPaymentMethodDisplay(order.payment_method)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Total: </span>
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    Rp{order.total_amount.toLocaleString('id-ID')}
                  </div>
                </div>
                {order.payment_amount && order.payment_amount !== order.total_amount && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Jumlah Dibayar: </span>
                    <div className="text-lg sm:text-xl font-semibold text-green-600">
                      Rp{order.payment_amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {order.payment_notes && (
              <div className="mt-3">
                <span className="text-sm font-medium text-muted-foreground">Notes: </span>
                <p className="text-sm sm:text-base mt-1">{order.payment_notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Item Pesanan</h3>
            <div className="space-y-3 sm:space-y-4">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="p-3 sm:p-4 bg-secondary rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h4 className="font-medium text-sm sm:text-base">{item.service_name}</h4>
                        {item.service_type && (
                          <Badge variant="outline" className="text-xs w-fit">
                            {item.service_type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        {/* Basic pricing info */}
                        <p>Rp{item.service_price.toLocaleString('id-ID')} × {item.quantity}</p>
                        
                        {/* Service type specific details */}
                        {item.service_type === 'kilo' && item.weight_kg && (
                          <p>Berat: {item.weight_kg} kg</p>
                        )}
                        
                        {item.service_type === 'combined' && (
                          <div className="space-y-1">
                            {item.weight_kg && <p>Berat: {item.weight_kg} kg</p>}
                            {item.unit_items && item.unit_items.length > 0 && (
                              <div>
                                <p className="font-medium">Item per Unit:</p>
                                <div className="ml-2 space-y-1">
                                  {item.unit_items.map((unitItem: any, unitIndex: number) => (
                                    <p key={unitIndex} className="text-xs">
                                      • {unitItem.item_name}: {unitItem.quantity} × Rp{unitItem.price_per_unit.toLocaleString('id-ID')}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {item.service_type === 'unit' && item.unit_items && item.unit_items.length > 0 && (
                          <div>
                            <p className="font-medium">Item per Unit:</p>
                            <div className="ml-2 space-y-1">
                              {item.unit_items.map((unitItem: any, unitIndex: number) => (
                                <p key={unitIndex} className="text-xs">
                                  • {unitItem.item_name}: {unitItem.quantity} × Rp{unitItem.price_per_unit.toLocaleString('id-ID')}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.estimated_completion && (
                          <p className="text-xs">
                            Siap pada: {formatDateLong(item.estimated_completion)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:text-left sm:min-w-0">
                      <p className="font-semibold text-sm sm:text-base">Rp{item.line_total.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2 sm:space-y-3 bg-secondary/30 p-3 sm:p-4 rounded-lg">
            <div className="flex justify-between text-lg sm:text-xl font-bold">
              <span>Total:</span>
              <span>Rp{order.total_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
