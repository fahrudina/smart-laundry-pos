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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { useStore } from '@/contexts/StoreContext';
import { Gift, Percent } from 'lucide-react';

interface CashPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerPhone?: string;
  onSubmit: (cashReceived: number, discountAmount: number, pointsRedeemed: number) => void;
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
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentStore } = useStore();
  const { data: customerPoints, isLoading: pointsLoading } = useCustomerPoints(customerPhone);

  // Calculate the discount amount based on type
  const discountAmount = discountType === 'custom'
    ? parseFloat(customDiscount) || 0
    : (parseFloat(pointsToRedeem) || 0) * 100;

  // Calculate final amount after discount
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Points available check
  const hasPoints = customerPoints && customerPoints.current_points > 0;
  const pointsAvailable = customerPoints?.current_points || 0;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setCashReceived('');
      setCustomDiscount('');
      setPointsToRedeem('');
      setChange(0);
      setDiscountType('custom');
    }
  }, [isOpen]);

  useEffect(() => {
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= finalAmount) {
      setChange(cash - finalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, finalAmount]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(cashReceived);
    const pointsRedeemed = discountType === 'points' ? (parseFloat(pointsToRedeem) || 0) : 0;

    if (!isNaN(cash) && cash >= finalAmount) {
      onSubmit(cash, discountAmount, pointsRedeemed);
    }
  };

  // Validate points input
  const pointsError = discountType === 'points' && parseFloat(pointsToRedeem) > pointsAvailable;
  const discountError = discountAmount > totalAmount;

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

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
              {discountAmount > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-sm">
                    Diskon: -Rp {formatCurrency(discountAmount)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Discount Section */}
            {currentStore?.enable_points && (
              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">Diskon (Opsional)</Label>
                <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'custom' | 'points')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="custom" className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Custom
                    </TabsTrigger>
                    <TabsTrigger value="points" className="flex items-center gap-1" disabled={!hasPoints}>
                      <Gift className="h-3 w-3" />
                      Poin {hasPoints && `(${pointsAvailable})`}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="custom" className="space-y-2">
                    <Input
                      type="number"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      placeholder="Masukkan diskon (Rp)"
                      className="text-center"
                      min={0}
                      max={totalAmount}
                    />
                    {discountError && (
                      <p className="text-xs text-red-600">Diskon tidak boleh melebihi total pembayaran</p>
                    )}
                  </TabsContent>
                  <TabsContent value="points" className="space-y-2">
                    {hasPoints ? (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Poin tersedia: {pointsAvailable}</span>
                          <span>1 poin = Rp100</span>
                        </div>
                        <Input
                          type="number"
                          value={pointsToRedeem}
                          onChange={(e) => setPointsToRedeem(e.target.value)}
                          placeholder="Masukkan jumlah poin"
                          className="text-center"
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
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Pelanggan belum memiliki poin
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Final Amount Display */}
            {discountAmount > 0 && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Total Setelah Diskon</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {formatCurrency(finalAmount)}
                </p>
              </div>
            )}
            
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                parseFloat(cashReceived) < finalAmount ||
                pointsError ||
                discountError
              }
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
