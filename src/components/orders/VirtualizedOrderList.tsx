import React, { memo, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Printer, Download, Receipt, Bluetooth, MessageSquare } from 'lucide-react';
import { Order } from '@/hooks/useOrdersOptimized';

interface VirtualizedOrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdatePayment: (orderId: string, status: string, method?: string) => void;
  onUpdateExecution: (orderId: string, status: string) => void;
  onShowPaymentDialog?: (order: Order) => void;
  height: number;
  onViewReceipt?: (orderId: string) => void;
  onPrintReceipt?: (orderId: string) => void;
  onPrintThermal?: (orderId: string) => void;
  onExportReceiptPDF?: (orderId: string, customerName: string) => void;
  onResendNotification?: (orderId: string) => void;
}

interface ItemData {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdatePayment: (orderId: string, status: string, method?: string) => void;
  onUpdateExecution: (orderId: string, status: string) => void;
  onShowPaymentDialog?: (order: Order) => void;
  onViewReceipt?: (orderId: string) => void;
  onPrintReceipt?: (orderId: string) => void;
  onPrintThermal?: (orderId: string) => void;
  onExportReceiptPDF?: (orderId: string, customerName: string) => void;
  onResendNotification?: (orderId: string) => void;
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
    <div style={style} className="px-1 sm:px-4">
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-2 sm:p-4">
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
                       order.execution_status === 'ready_for_pickup' ? '📦' : 
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
                  <span className="font-medium">Telepon: </span>
                  {order.customer_phone}
                </div>
                <div className="truncate">
                  <span className="font-medium">ID Pesanan: </span>
                  {order.id.slice(-8)}
                </div>
                <div className="truncate">
                  <span className="font-medium">Dibuat: </span>
                  {formatDate(order.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                <div>
                  <span className="font-medium">Item: </span>
                  {order.order_items?.length || 0} item
                </div>
                <div>
                  <span className="font-medium">Total: </span>
                  <span className="font-bold text-primary text-lg">
                    Rp{order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Down Payment Information */}
              {order.payment_status === 'down_payment' && order.payment_amount !== null && order.payment_amount !== undefined && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-yellow-700 font-medium">DP Dibayar: </span>
                      <span className="font-bold text-yellow-900">
                        Rp{order.payment_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-orange-700 font-medium">Sisa: </span>
                      <span className="font-bold text-orange-900">
                        Rp{(order.total_amount - order.payment_amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile-optimized Action Buttons */}
              <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-4">
                {/* Row 1: Main Actions in grid */}
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOrderClick(order)}
                    className="flex items-center justify-center space-x-1 text-xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Lihat</span>
                  </Button>

                  {data.onViewReceipt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => data.onViewReceipt!(order.id)}
                      className="flex items-center justify-center space-x-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Struk</span>
                    </Button>
                  )}
                </div>

                {/* Row 2: Print Actions */}
                {data.onPrintThermal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => data.onPrintThermal!(order.id)}
                    className="w-full flex items-center justify-center space-x-1 text-xs border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Cetak Struk</span>
                  </Button>
                )}

                {/* Row 2.5: WhatsApp Resend Action */}
                {data.onResendNotification && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => data.onResendNotification!(order.id)}
                    className="w-full flex items-center justify-center space-x-1 text-xs border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Kirim Ulang WA</span>
                  </Button>
                )}

                {/* Row 3: Status Action */}
                {order.execution_status === 'in_queue' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'in_progress')}
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    🔄 Mulai Proses
                  </Button>
                )}
                {order.execution_status === 'in_progress' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'ready_for_pickup')}
                    className="w-full text-xs bg-orange-600 hover:bg-orange-700"
                  >
                    📦 Siap Diambil
                  </Button>
                )}
                {order.execution_status === 'ready_for_pickup' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUpdateExecution(order.id, 'completed')}
                    className="w-full text-xs bg-green-600 hover:bg-green-700"
                  >
                    ✅ Mark as Picked Up
                  </Button>
                )}

                {/* Row 4: Payment Actions */}
                {order.payment_status === 'pending' && data.onShowPaymentDialog && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => data.onShowPaymentDialog!(order)}
                    className="w-full text-xs bg-green-600 hover:bg-green-700"
                  >
                    💳 Proses Pembayaran
                  </Button>
                )}
                {order.payment_status === 'down_payment' && data.onShowPaymentDialog && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => data.onShowPaymentDialog!(order)}
                    className="w-full text-xs bg-orange-600 hover:bg-orange-700"
                  >
                    💰 Selesaikan Pembayaran DP
                  </Button>
                )}
                {order.payment_status === 'pending' && !data.onShowPaymentDialog && (
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePayment(order.id, 'completed', 'cash')}
                      className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                    >
                      💵 Cash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePayment(order.id, 'completed', 'qris')}
                      className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      📱 QRIS
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
  onShowPaymentDialog,
  height,
  onViewReceipt,
  onPrintReceipt,
  onPrintThermal,
  onExportReceiptPDF,
  onResendNotification
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
    onShowPaymentDialog,
    onViewReceipt,
    onPrintReceipt,
    onPrintThermal,
    onExportReceiptPDF,
    onResendNotification,
  };

  // Responsive item size - accounts for all action buttons including WhatsApp resend
  // Mobile: 460px to prevent button overlap on small screens
  // Desktop: 410px provides adequate spacing for all buttons
  const itemSize = isMobile ? 460 : 410;

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
