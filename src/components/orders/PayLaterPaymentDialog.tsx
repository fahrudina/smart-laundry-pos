import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, QrCode, Smartphone, Gift, Percent } from 'lucide-react';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { useStore } from '@/contexts/StoreContext';

// Points to currency conversion rate (1 point = 100 Rupiah)
export const POINTS_TO_CURRENCY_RATE = 100;

interface PayLaterPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerPhone: string;
  customerName: string;
  orderId: string;
  onSubmit: (data: {
    paymentMethod: string;
    cashReceived?: number;
    pointsRedeemed?: number;
    discountAmount?: number;
  }) => void;
}

export const PayLaterPaymentDialog: React.FC<PayLaterPaymentDialogProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customerPhone,
  customerName,
  orderId,
  onSubmit,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [discountType, setDiscountType] = useState<'custom' | 'points'>('custom');
  const [customDiscount, setCustomDiscount] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentStore } = useStore();
  const { data: customerPoints } = useCustomerPoints(customerPhone);

  const paymentMethods = [
    { id: 'cash', name: 'Tunai', icon: Banknote, color: 'bg-green-500' },
    { id: 'qris', name: 'QRIS', icon: QrCode, color: 'bg-blue-500' },
    { id: 'transfer', name: 'Transfer', icon: Smartphone, color: 'bg-purple-500' },
  ];

  // Points available check
  const hasPoints = customerPoints && customerPoints.current_points > 0;
  const pointsAvailable = customerPoints?.current_points || 0;

  // Calculate final amount after discount
  const finalAmount = totalAmount - discountAmount;

  // Validate points input
  const pointsError = discountType === 'points' && parseFloat(pointsToRedeem) > pointsAvailable;
  const discountError = discountAmount > totalAmount;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedPaymentMethod('cash');
      setCashReceived('');
      setChange(0);
      setDiscountType('custom');
      setCustomDiscount('');
      setPointsToRedeem('');
      setDiscountAmount(0);
      setPointsRedeemed(0);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Calculate change for cash payments
  useEffect(() => {
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= finalAmount) {
      setChange(cash - finalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, finalAmount]);

  // Handle discount changes
  const handleCustomDiscountChange = (value: string) => {
    setCustomDiscount(value);
    const amount = parseFloat(value) || 0;
    setDiscountAmount(amount);
    setPointsRedeemed(0);
  };

  const handlePointsToRedeemChange = (value: string) => {
    setPointsToRedeem(value);
    const points = parseFloat(value) || 0;
    const amount = points * POINTS_TO_CURRENCY_RATE;
    setDiscountAmount(amount);
    setPointsRedeemed(points);
  };

  const handleDiscountTypeChange = (type: 'custom' | 'points') => {
    setDiscountType(type);
    if (type === 'custom') {
      setPointsToRedeem('');
      const amount = parseFloat(customDiscount) || 0;
      setDiscountAmount(amount);
      setPointsRedeemed(0);
    } else {
      setCustomDiscount('');
      const points = parseFloat(pointsToRedeem) || 0;
      setDiscountAmount(points * POINTS_TO_CURRENCY_RATE);
      setPointsRedeemed(points);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Validate cash payment
    if (selectedPaymentMethod === 'cash') {
      const cash = parseFloat(cashReceived);
      if (isNaN(cash) || cash < finalAmount) {
        return;
      }
    }

    // Validate points and discount
    if (pointsError || discountError) {
      return;
    }

    setIsSubmitting(true);
    
    onSubmit({
      paymentMethod: selectedPaymentMethod,
      cashReceived: selectedPaymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
      pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
    });
  };

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  // Check if submit is valid
  const isSubmitValid = () => {
    if (pointsError || discountError) return false;
    if (selectedPaymentMethod === 'cash') {
      const cash = parseFloat(cashReceived);
      return !isNaN(cash) && cash >= finalAmount;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="pay-later-payment-description">
        <DialogHeader>
          <DialogTitle>Pembayaran Pesanan</DialogTitle>
          <DialogDescription id="pay-later-payment-description">
            Proses pembayaran untuk pesanan {customerName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            {/* Order Info */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Pelanggan</p>
              <p className="font-semibold">{customerName}</p>
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            </div>

            {/* Total Amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-3xl font-bold text-blue-600">
                Rp {formatCurrency(totalAmount)}
              </p>
            </div>

            <Separator />

            {/* Discount Section */}
            {currentStore?.enable_points && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Diskon (Opsional)</Label>
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
                      max={totalAmount}
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
                          <span>1 poin = Rp{POINTS_TO_CURRENCY_RATE}</span>
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
                            Diskon: Rp {formatCurrency(parseFloat(pointsToRedeem) * POINTS_TO_CURRENCY_RATE)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Pelanggan belum memiliki poin
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Final Amount after discount */}
            {discountAmount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>Rp {formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Diskon:</span>
                  <span className="text-green-600">-Rp {formatCurrency(discountAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-blue-600">Rp {formatCurrency(finalAmount)}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === method.id
                          ? `border-blue-500 ${method.color} text-white`
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Payment Section - Only show when cash is selected */}
            {selectedPaymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cash-received">Uang Diterima</Label>
                  <Input
                    id="cash-received"
                    ref={inputRef}
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-lg h-12 text-center"
                    placeholder="Contoh: 50000"
                    min={finalAmount}
                  />
                </div>

                <div className="flex justify-center gap-2 flex-wrap">
                  {quickCashOptions.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(String(amount))}
                      disabled={amount < finalAmount}
                    >
                      {amount >= 1000000 ? `${amount / 1000000}jt` : `${amount / 1000}rb`}
                    </Button>
                  ))}
                </div>

                {parseFloat(cashReceived) >= finalAmount && change > 0 && (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">Kembalian</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {formatCurrency(change)}
                    </p>
                  </div>
                )}

                {parseFloat(cashReceived) >= finalAmount && change === 0 && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">Uang Pas</p>
                    <p className="text-lg font-semibold text-blue-600">
                      Tidak ada kembalian
                    </p>
                  </div>
                )}

                {parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < finalAmount && (
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">Uang Kurang</p>
                    <p className="text-lg font-semibold text-red-600">
                      Kurang Rp {formatCurrency(finalAmount - parseFloat(cashReceived))}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!isSubmitValid() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
