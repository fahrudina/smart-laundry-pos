import React from 'react';
import { Clock, ShoppingCart, CreditCard, X, Minus, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface OrderItem {
  service: {
    id: string;
    name: string;
    price: number;
    duration: string;
    durationValue: number;
    durationUnit: 'hours' | 'days';
    category: string;
  };
  quantity: number;
  serviceType: 'unit' | 'kilo' | 'combined';
  weight?: number;
  totalPrice: number;
}

interface FloatingOrderSummaryProps {
  currentOrder: OrderItem[];
  getTotalPrice: () => number;
  getOrderCompletionTime: () => Date | null;
  formatDate: (date: Date) => string;
  dropOffDate: Date;
  onProcessPayment: () => void;
  onCreateDraft: () => void;
  onOpenServicePopup?: () => void;
  isProcessing: boolean;
  customerName: string;
  customerPhone: string;
  calculateFinishDate: (service: any, dropOffDate?: Date) => Date;
  updateQuantity: (serviceId: string, quantity: number, serviceType: 'unit' | 'kilo' | 'combined') => void;
  removeFromOrder: (serviceId: string, serviceType: 'unit' | 'kilo' | 'combined') => void;
}

export const FloatingOrderSummary: React.FC<FloatingOrderSummaryProps> = ({
  currentOrder,
  getTotalPrice,
  getOrderCompletionTime,
  formatDate,
  dropOffDate,
  onProcessPayment,
  onCreateDraft,
  onOpenServicePopup,
  isProcessing,
  customerName,
  customerPhone,
  calculateFinishDate,
  updateQuantity,
  removeFromOrder,
}) => {
  if (currentOrder.length === 0) return null;

  const subtotal = getTotalPrice();
  const taxAmount = subtotal * 0.11;
  const totalAmount = subtotal + taxAmount;
  const completionTime = getOrderCompletionTime();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <Card className="bg-white shadow-2xl border-2 border-blue-200 animate-slide-up">
        <CardContent className="p-4">
          {/* Order Count Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Current Order</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {currentOrder.reduce((sum, item) => sum + item.quantity, 0)} items
            </Badge>
          </div>

          {/* Estimated Completion */}
          {completionTime && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Estimated Completion</span>
              </div>
              <p className="text-sm text-blue-800 font-semibold">
                {formatDate(completionTime)}
              </p>
              <p className="text-xs text-blue-600">
                Drop-off: {formatDate(dropOffDate)}
              </p>
            </div>
          )}

          {/* Order Items List */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-800">Order Items</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenServicePopup}
                className="h-6 w-6 p-0 border-green-300 text-green-600 hover:bg-green-50"
                title="Add more items"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentOrder.map((item, index) => (
                <div key={`${item.service.id}-${item.serviceType}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{item.service.name}</h5>
                    <p className="text-xs text-gray-600">
                      Rp{item.service.price.toLocaleString('id-ID')} × {item.quantity}
                      {item.serviceType === 'kilo' ? ' kg' : ' unit'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ready: {formatDate(calculateFinishDate(item.service, dropOffDate))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.service.id, item.quantity - 1, item.serviceType)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    {item.serviceType === 'kilo' ? (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = Math.max(3, parseInt(e.target.value) || 3);
                          updateQuantity(item.service.id, value, item.serviceType);
                        }}
                        className="w-10 h-6 text-xs text-center"
                        min="3"
                      />
                    ) : (
                      <span className="w-6 text-center text-xs">{item.quantity}</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.service.id, item.quantity + 1, item.serviceType)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromOrder(item.service.id, item.serviceType)}
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="mb-3" />

          {/* Price Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax (11%):</span>
              <span>Rp{taxAmount.toLocaleString('id-ID')}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-blue-600">Rp{totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 text-sm" 
              onClick={onProcessPayment}
              disabled={isProcessing || !customerName || !customerPhone}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Process Payment"}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 py-2 text-sm" 
              onClick={onCreateDraft}
              disabled={isProcessing || !customerName || !customerPhone}
            >
              <Clock className="h-4 w-4 mr-2" />
              Create Order (Draft)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
