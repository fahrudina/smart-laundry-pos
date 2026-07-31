import React, { useState, useEffect } from 'react';
import { Clock, ShoppingCart, CreditCard, X, Minus, Plus, Banknote, QrCode, Smartphone, Gift, Percent, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { useStore } from '@/contexts/StoreContext';
import { DynamicOrderItemData } from './orderTypes';

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
  const [isPaymentStarted, setIsPaymentStarted] = useState(false);
  // Collapsed by default so the cart/checkout panel doesn't sit on top of the
  // service list - it only covers the page once the user asks to see it.
  const [isExpanded, setIsExpanded] = useState(false);
  // Briefly highlights the collapsed bar when an item lands, since the cart
  // is easy to miss otherwise while it's collapsed.
  const [justAdded, setJustAdded] = useState(false);

  const { currentStore } = useStore();
  const { data: customerPoints } = useCustomerPoints(customerPhone);

  const itemCount = currentOrder.reduce((sum, item) => sum + item.quantity, 0) + dynamicItems.length;
  const prevItemCountRef = React.useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevItemCountRef.current) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 500);
      prevItemCountRef.current = itemCount;
      return () => clearTimeout(timer);
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount]);

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

  // Reset payment started state when processing completes or fails
  useEffect(() => {
    if (!isProcessing && isPaymentStarted) {
      setIsPaymentStarted(false);
    }
  }, [isProcessing, isPaymentStarted]);

  // Handle payment button click with duplicate prevention
  const handlePaymentClick = (paymentMethod: string) => {
    // Prevent duplicate clicks - check both local state and processing state
    if (isPaymentStarted || isProcessing) {
      return;
    }
    setIsPaymentStarted(true);
    onProcessPayment(paymentMethod);
  };

  // Handle draft order button click with duplicate prevention
  const handleDraftClick = () => {
    // Prevent duplicate clicks - check both local state and processing state
    if (isPaymentStarted || isProcessing) {
      return;
    }
    setIsPaymentStarted(true);
    onCreateDraft();
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

  // Collapsed: a compact bar that summarizes the cart without covering the
  // page underneath - tap it to see items, discount, and payment options.
  if (!isExpanded) {
    return (
      <div className="fixed bottom-1 sm:bottom-4 left-1 sm:left-4 right-1 sm:right-4 z-50 max-w-lg mx-auto">
        <div className="relative">
          <div className="absolute -top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-primary/30" />
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`flex w-full items-center justify-between gap-2 rounded-t-2xl rounded-b-xl border-2 border-t-2 border-dashed bg-card px-3 py-2.5 shadow-2xl transition-colors animate-slide-up sm:px-4 sm:py-3 ${
              justAdded ? 'animate-button-success border-pos-success/50 bg-pos-success/10' : 'border-primary/25'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ShoppingCart className={`h-5 w-5 flex-shrink-0 ${justAdded ? 'text-pos-success' : 'text-primary'}`} />
              <span className="truncate text-sm font-semibold text-foreground sm:text-base">
                {itemCount} item · <span className="text-primary">Rp{formatCurrency(totalAmount)}</span>
              </span>
            </div>
            <ChevronUp className="h-5 w-5 flex-shrink-0 text-primary" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-1 sm:bottom-4 left-1 sm:left-4 right-1 sm:right-4 z-50 max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute -top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-primary/30" />
        <Card className="rounded-t-2xl border-2 border-t-2 border-dashed border-primary/25 bg-card shadow-2xl animate-slide-up">
        <CardContent className="p-2 sm:p-4">
          {/* Order Count Badge */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Pesanan Saat Ini</span>
              <Badge
                variant="secondary"
                className={`text-xs sm:text-sm transition-colors ${
                  justAdded ? 'animate-button-success bg-pos-success/20 text-pos-success' : 'bg-pos-highlight/40 text-primary'
                }`}
              >
                {itemCount} item
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                onOpenServicePopup?.();
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted flex-shrink-0"
              title="Sembunyikan untuk menambah layanan lain"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Estimated Completion */}
          {completionTime && (
            <div className="mb-2 sm:mb-3 p-2 bg-pos-highlight/20 border border-pos-highlight/60 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-primary">Estimasi Selesai</span>
              </div>
              <p className="text-xs sm:text-sm text-primary/90 font-semibold">
                {formatDate(completionTime)}
              </p>
              <p className="text-xs text-primary/70">
                Diterima: {formatDate(dropOffDate)}
              </p>
            </div>
          )}

          {/* Order Items List */}
          <div className="mb-2 sm:mb-3">
            <h4 className="text-sm font-medium text-foreground mb-1 sm:mb-2">Item Pesanan</h4>
            <div className="space-y-1 sm:space-y-2 max-h-40 overflow-y-auto">
              {currentOrder.map((item, index) => (
                <div key={`${item.service.id}-${item.serviceType}-${index}`} className="flex items-center justify-between p-1.5 sm:p-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-foreground truncate">{item.service.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      Rp{item.service.price.toLocaleString('id-ID')} × {item.serviceType === 'kilo' ? `${item.quantity.toFixed(1)} kg` : `${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-xs text-pos-success">
                      Siap: {formatDate(calculateFinishDate(item.service, dropOffDate))}
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
                      className="h-6 w-6 p-0 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Dynamic Items */}
              {dynamicItems.map((item, index) => (
                <div key={`dynamic-${item.id}-${index}`} className="flex items-center justify-between p-1.5 sm:p-2 bg-accent/10 border border-accent/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-foreground truncate">{item.itemName}</h5>
                    <p className="text-xs text-muted-foreground">
                      Rp{item.price.toLocaleString('id-ID')} × {item.unitType === 'kilo' ? `${item.quantity.toFixed(1)} kg` : `${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-xs text-pos-success">
                      Siap: {calculateDynamicItemFinishDate ? formatDate(calculateDynamicItemFinishDate(item, dropOffDate)) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge variant="outline" className="text-xs bg-accent/20 text-accent-foreground border-accent/40">
                      Kustom
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (removeDynamicItem) {
                          removeDynamicItem(index);
                        }
                      }}
                      className="h-6 w-6 p-0 text-destructive"
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
                    Kustom
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
                    <p className="text-xs text-destructive">Diskon tidak boleh melebihi total pembayaran</p>
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
                        <p className="text-xs text-destructive">Poin tidak mencukupi! Maksimal: {pointsAvailable} poin</p>
                      )}
                      {parseFloat(pointsToRedeem) > 0 && !pointsError && (
                        <p className="text-xs text-pos-success text-center">
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
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium text-foreground">Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diskon:</span>
                <span className="font-medium text-pos-success">-Rp{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total:</span>
              <span className="text-primary">Rp{totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-sm font-medium text-foreground">Metode Pembayaran</label>
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
                        ? `border-primary ${method.color} text-white`
                        : 'border-border bg-card text-foreground hover:border-primary/40'
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
              variant="accent"
              className="w-full py-2 sm:py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePaymentClick(selectedPaymentMethod)}
              disabled={isProcessing || isPaymentStarted || !customerName || !customerPhone || pointsError || discountError}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing || isPaymentStarted ? "Memproses..." : "Bayar Sekarang"}
            </Button>

            <Button
              variant="outline"
              className="w-full text-primary border-primary/40 hover:bg-pos-highlight/20 py-1.5 sm:py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDraftClick}
              disabled={isProcessing || isPaymentStarted || !customerName || !customerPhone || pointsError || discountError}
            >
              <Clock className="h-4 w-4 mr-2" />
              Bayar Nanti
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};
