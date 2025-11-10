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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { calculateDiscountFromPoints, validatePointRedemption, POINTS_TO_RUPIAH_RATE } from '@/hooks/usePointRedemption';

interface CashPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerPhone?: string;
  onSubmit: (cashReceived: number, discountAmount?: number, pointsUsed?: number) => void;
}

export const CashPaymentDialog: React.FC<CashPaymentDialogProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customerPhone,
  onSubmit,
}) => {
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [discountType, setDiscountType] = useState<'custom' | 'points'>('custom');
  const [customDiscount, setCustomDiscount] = useState('');
  const [pointsToUse, setPointsToUse] = useState('');
  const [discountError, setDiscountError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch customer points if customer phone is provided
  const { data: customerPoints } = useCustomerPoints(customerPhone);
  const hasPoints = customerPoints && customerPoints.current_points > 0;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setCashReceived('');
      setChange(0);
      setCustomDiscount('');
      setPointsToUse('');
      setDiscountError('');
      setDiscountType('custom');
    }
  }, [isOpen]);

  // Calculate actual discount amount
  const getDiscountAmount = (): number => {
    if (discountType === 'custom') {
      const discount = parseFloat(customDiscount);
      return !isNaN(discount) && discount > 0 ? discount : 0;
    } else {
      const points = parseInt(pointsToUse);
      return !isNaN(points) && points > 0 ? calculateDiscountFromPoints(points) : 0;
    }
  };

  // Calculate final amount after discount
  const getFinalAmount = (): number => {
    const discount = getDiscountAmount();
    return Math.max(0, totalAmount - discount);
  };

  useEffect(() => {
    const cash = parseFloat(cashReceived);
    // Calculate discount inline to avoid dependency warning
    let discount = 0;
    if (discountType === 'custom') {
      const customDiscountValue = parseFloat(customDiscount);
      discount = !isNaN(customDiscountValue) && customDiscountValue > 0 ? customDiscountValue : 0;
    } else {
      const points = parseInt(pointsToUse);
      discount = !isNaN(points) && points > 0 ? calculateDiscountFromPoints(points) : 0;
    }
    const finalAmount = Math.max(0, totalAmount - discount);
    
    if (!isNaN(cash) && cash >= finalAmount) {
      setChange(cash - finalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, totalAmount, customDiscount, pointsToUse, discountType]);

  // Validate discount when it changes
  useEffect(() => {
    setDiscountError('');
    
    if (discountType === 'custom') {
      const discount = parseFloat(customDiscount);
      if (!isNaN(discount) && discount > 0) {
        if (discount > totalAmount) {
          setDiscountError('Diskon tidak boleh melebihi total pesanan');
        }
      }
    } else if (discountType === 'points') {
      const points = parseInt(pointsToUse);
      if (!isNaN(points) && points > 0) {
        const validation = validatePointRedemption(
          points,
          customerPoints?.current_points || 0,
          totalAmount
        );
        if (!validation.valid && validation.error) {
          setDiscountError(validation.error);
        }
      }
    }
  }, [customDiscount, pointsToUse, discountType, customerPoints, totalAmount]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cash = parseFloat(cashReceived);
    const finalAmount = getFinalAmount();
    const discountAmount = getDiscountAmount();
    
    // Check if there's a discount error
    if (discountError) {
      return;
    }
    
    if (!isNaN(cash) && cash >= finalAmount) {
      const pointsUsed = discountType === 'points' ? parseInt(pointsToUse) || 0 : 0;
      onSubmit(cash, discountAmount, pointsUsed);
    }
  };

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  const finalAmount = getFinalAmount();
  const discountAmount = getDiscountAmount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="cash-payment-description">
        <DialogHeader>
          <DialogTitle>Pembayaran Tunai</DialogTitle>
          <DialogDescription id="cash-payment-description">
            Masukkan jumlah uang tunai yang diterima dari pelanggan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-3xl font-bold text-blue-600">
                Rp {formatCurrency(totalAmount)}
              </p>
            </div>

            {/* Discount Section */}
            <div className="space-y-2 border-t pt-4">
              <Label>Diskon (Opsional)</Label>
              <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'custom' | 'points')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="custom">Diskon Manual</TabsTrigger>
                  <TabsTrigger value="points" disabled={!hasPoints}>
                    Gunakan Poin {hasPoints && (
                      <Badge variant="secondary" className="ml-1">{customerPoints?.current_points}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="custom" className="space-y-2 mt-2">
                  <Input
                    type="number"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    placeholder="Masukkan jumlah diskon (Rp)"
                    min={0}
                    max={totalAmount}
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Masukkan diskon dalam Rupiah
                  </p>
                </TabsContent>
                
                <TabsContent value="points" className="space-y-2 mt-2">
                  {hasPoints ? (
                    <>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium text-center">
                          Poin Tersedia: {customerPoints?.current_points} poin
                        </p>
                        <p className="text-xs text-blue-600 text-center">
                          (1 poin = Rp{POINTS_TO_RUPIAH_RATE})
                        </p>
                      </div>
                      <Input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(e.target.value)}
                        placeholder="Jumlah poin yang digunakan"
                        min={0}
                        max={customerPoints?.current_points}
                        className="text-center"
                      />
                      {parseInt(pointsToUse) > 0 && (
                        <p className="text-sm text-center text-green-600 font-medium">
                          Diskon: Rp {formatCurrency(calculateDiscountFromPoints(parseInt(pointsToUse)))}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Pelanggan tidak memiliki poin
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {discountError && (
                <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-600">{discountError}</p>
                </div>
              )}

              {discountAmount > 0 && !discountError && (
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Total Setelah Diskon</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {formatCurrency(finalAmount)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Hemat Rp {formatCurrency(discountAmount)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2 border-t pt-4">
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={parseFloat(cashReceived) < finalAmount || !!discountError}
              className="bg-green-600 hover:bg-green-700"
            >
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
