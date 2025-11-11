import React, { useState } from 'react';
import { Clock, ShoppingCart, CreditCard, X, Minus, Plus, Banknote, QrCode, Smartphone, Gift, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { useStore } from '@/contexts/StoreContext';

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

interface DynamicOrderItemData {
  id: string;
  itemName: string;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  price: number;
  quantity: number;
  totalPrice: number;
}

interface FloatingOrderSummaryProps {
  currentOrder: OrderItem[];
  dynamicItems?: DynamicOrderItemData[];
  getTotalPrice: () => number;
  getOrderCompletionTime: () => Date | null;
  formatDate: (date: Date) => string;
  dropOffDate: Date;
  onProcessPayment: (paymentMethod?: string) => void;
  onCreateDraft: () => void;
  onOpenServicePopup?: () => void;
  isProcessing: boolean;
  customerName: string;
  customerPhone: string;
  calculateFinishDate: (service: any, dropOffDate?: Date) => Date;
  calculateDynamicItemFinishDate?: (item: DynamicOrderItemData, dropOffDate?: Date) => Date;
  updateQuantity?: (serviceId: string, quantity: number, serviceType: 'unit' | 'kilo' | 'combined') => void;
  removeFromOrder?: (serviceId: string, serviceType: 'unit' | 'kilo' | 'combined') => void;
  removeDynamicItem?: (index: number) => void;
  discountAmount: number;
  pointsRedeemed: number;
  onDiscountChange: (amount: number) => void;
  onPointsRedeemedChange: (points: number) => void;
}

export const FloatingOrderSummary: React.FC<FloatingOrderSummaryProps> = ({
  currentOrder,
  dynamicItems = [],
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
  calculateDynamicItemFinishDate,
  updateQuantity,
  removeFromOrder,
  removeDynamicItem,
  discountAmount,
  pointsRedeemed,
  onDiscountChange,
  onPointsRedeemedChange,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [discountType, setDiscountType] = useState<'custom' | 'points'>('custom');
  const [customDiscount, setCustomDiscount] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');

  const { currentStore } = useStore();
  const { data: customerPoints } = useCustomerPoints(customerPhone);

  const paymentMethods = [
    { id: 'cash', name: 'Tunai', icon: Banknote, color: 'bg-green-500' },
    { id: 'qris', name: 'QRIS', icon: QrCode, color: 'bg-blue-500' },
    { id: 'transfer', name: 'Transfer', icon: Smartphone, color: 'bg-purple-500' },
  ];

  // Handle discount changes
  const handleCustomDiscountChange = (value: string) => {
    setCustomDiscount(value);
    const amount = parseFloat(value) || 0;
    onDiscountChange(amount);
    onPointsRedeemedChange(0);
  };

  const handlePointsToRedeemChange = (value: string) => {
    setPointsToRedeem(value);
    const points = parseFloat(value) || 0;
    const amount = points * 100;
    onDiscountChange(amount);
    onPointsRedeemedChange(points);
  };

  const handleDiscountTypeChange = (type: 'custom' | 'points') => {
    setDiscountType(type);
    if (type === 'custom') {
      setPointsToRedeem('');
      const amount = parseFloat(customDiscount) || 0;
      onDiscountChange(amount);
      onPointsRedeemedChange(0);
    } else {
      setCustomDiscount('');
      const points = parseFloat(pointsToRedeem) || 0;
      onDiscountChange(points * 100);
      onPointsRedeemedChange(points);
    }
  };

  // Points available check
  const hasPoints = customerPoints && customerPoints.current_points > 0;
  const pointsAvailable = customerPoints?.current_points || 0;

  // Validate points input
  const pointsError = discountType === 'points' && parseFloat(pointsToRedeem) > pointsAvailable;
  const discountError = discountAmount > getTotalPrice();

  if (currentOrder.length === 0 && dynamicItems.length === 0) {
    return null;
  }

  const subtotal = getTotalPrice();
  const totalAmount = subtotal - discountAmount;
  const completionTime = getOrderCompletionTime();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  return (
    <div className="fixed bottom-1 sm:bottom-4 left-1 sm:left-4 right-1 sm:right-4 z-50 max-w-lg mx-auto">
      <Card className="bg-white shadow-2xl border-2 border-blue-200 animate-slide-up">
        <CardContent className="p-2 sm:p-4">
          {/* Order Count Badge */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span className="font-semibold text-gray-800 text-sm sm:text-base">Current Order</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
              {currentOrder.reduce((sum, item) => sum + item.quantity, 0) + dynamicItems.length} items
            </Badge>
          </div>

          {/* Estimated Completion */}
          {completionTime && (
            <div className="mb-2 sm:mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-900">Estimated Completion</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-800 font-semibold">
                {formatDate(completionTime)}
              </p>
              <p className="text-xs text-blue-600">
                Drop-off: {formatDate(dropOffDate)}
              </p>
            </div>
          )}

          {/* Order Items List */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
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
            <div className="space-y-1 sm:space-y-2 max-h-40 overflow-y-auto">
              {currentOrder.map((item, index) => (
                <div key={`${item.service.id}-${item.serviceType}-${index}`} className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{item.service.name}</h5>
                    <p className="text-xs text-gray-600">
                      Rp{item.service.price.toLocaleString('id-ID')} × {item.serviceType === 'kilo' ? `${item.quantity.toFixed(1)} kg` : `${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ready: {formatDate(calculateFinishDate(item.service, dropOffDate))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (updateQuantity) {
                          const decrement = item.serviceType === 'kilo' ? 0.1 : 1;
                          const newValue = Math.max(item.serviceType === 'kilo' ? 0.1 : 1, item.quantity - decrement);
                          // Round to 1 decimal place to avoid floating point precision issues
                          const roundedValue = Math.round(newValue * 10) / 10;
                          updateQuantity(item.service.id, roundedValue, item.serviceType);
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    {item.serviceType === 'kilo' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => {
                          if (updateQuantity) {
                            const inputValue = parseFloat(e.target.value);
                            if (!isNaN(inputValue)) {
                              // Round to 1 decimal place and ensure minimum 0.1
                              const value = Math.max(0.1, Math.round(inputValue * 10) / 10);
                              updateQuantity(item.service.id, value, item.serviceType);
                            }
                          }
                        }}
                        className="w-14 h-6 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="0.1"
                      />
                    ) : (
                      <span className="w-6 text-center text-xs">{item.quantity}</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (updateQuantity) {
                          const increment = item.serviceType === 'kilo' ? 0.1 : 1;
                          const newValue = item.quantity + increment;
                          // Round to 1 decimal place to avoid floating point precision issues
                          const roundedValue = Math.round(newValue * 10) / 10;
                          updateQuantity(item.service.id, roundedValue, item.serviceType);
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (removeFromOrder) {
                          removeFromOrder(item.service.id, item.serviceType);
                        }
                      }}
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Dynamic Items */}
              {dynamicItems.map((item, index) => (
                <div key={`dynamic-${item.id}-${index}`} className="flex items-center justify-between p-1.5 sm:p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{item.itemName}</h5>
                    <p className="text-xs text-gray-600">
                      Rp{item.price.toLocaleString('id-ID')} × {item.quantity} unit{item.quantity !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ready: {calculateDynamicItemFinishDate ? formatDate(calculateDynamicItemFinishDate(item, dropOffDate)) : 'TBD'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                      Custom
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (removeDynamicItem) {
                          removeDynamicItem(index);
                        }
                      }}
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="mb-2 sm:mb-3" />

          {/* Discount Section */}
          {currentStore?.enable_points && (
            <div className="space-y-2 mb-3">
              <Label className="text-xs sm:text-sm font-medium">Diskon (Opsional)</Label>
              <Tabs value={discountType} onValueChange={(v) => handleDiscountTypeChange(v as 'custom' | 'points')}>
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="custom" className="flex items-center gap-1 text-xs">
                    <Percent className="h-3 w-3" />
                    Custom
                  </TabsTrigger>
                  <TabsTrigger value="points" className="flex items-center gap-1 text-xs" disabled={!hasPoints}>
                    <Gift className="h-3 w-3" />
                    Poin {hasPoints && `(${pointsAvailable})`}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="custom" className="space-y-1 mt-2">
                  <Input
                    type="number"
                    value={customDiscount}
                    onChange={(e) => handleCustomDiscountChange(e.target.value)}
                    placeholder="Masukkan diskon (Rp)"
                    className="text-center h-8 text-sm"
                    min={0}
                    max={subtotal}
                  />
                  {discountError && (
                    <p className="text-xs text-red-600">Diskon tidak boleh melebihi total pembayaran</p>
                  )}
                </TabsContent>
                <TabsContent value="points" className="space-y-1 mt-2">
                  {hasPoints ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Poin tersedia: {pointsAvailable}</span>
                        <span>1 poin = Rp100</span>
                      </div>
                      <Input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => handlePointsToRedeemChange(e.target.value)}
                        placeholder="Masukkan jumlah poin"
                        className="text-center h-8 text-sm"
                        min={0}
                        max={pointsAvailable}
                      />
                      {pointsError && (
                        <p className="text-xs text-red-600">Poin tidak mencukupi! Maksimal: {pointsAvailable} poin</p>
                      )}
                      {parseFloat(pointsToRedeem) > 0 && !pointsError && (
                        <p className="text-xs text-green-600 text-center">
                          Diskon: Rp {formatCurrency(parseFloat(pointsToRedeem) * 100)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
                      Pelanggan belum memiliki poin
                    </p>
                  )}
                </TabsContent>
              </Tabs>
              <Separator />
            </div>
          )}

          {/* Price Summary */}
          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon:</span>
                <span className="font-medium text-green-600">-Rp{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-blue-600">Rp{totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-sm font-medium text-gray-700">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`flex flex-col items-center p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      selectedPaymentMethod === method.id
                        ? `border-blue-500 ${method.color} text-white`
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                    <span className="text-xs font-medium">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1 sm:space-y-2">
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 sm:py-3 text-sm"
              onClick={() => onProcessPayment(selectedPaymentMethod)}
              disabled={isProcessing || !customerName || !customerPhone || pointsError || discountError}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Bayar Sekarang"}
            </Button>

            <Button
              variant="outline"
              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 py-1.5 sm:py-2 text-sm"
              onClick={onCreateDraft}
              disabled={isProcessing || !customerName || !customerPhone || pointsError || discountError}
            >
              <Clock className="h-4 w-4 mr-2" />
              Bayar Nanti
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
