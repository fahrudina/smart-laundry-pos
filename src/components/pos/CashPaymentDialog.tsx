import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

interface CashPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (cashReceived: number, isDownPayment?: boolean) => void;
}

export const CashPaymentDialog: React.FC<CashPaymentDialogProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onSubmit,
}) => {
  const [paymentType, setPaymentType] = useState<'full' | 'down_payment'>('full');
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize parsed cash value to avoid repeated parsing
  const cashValue = useMemo(() => parseFloat(cashReceived) || 0, [cashReceived]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPaymentType('full');
      setCashReceived('');
      setChange(0);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isNaN(cashValue)) {
      if (paymentType === 'full' && cashValue >= totalAmount) {
        setChange(cashValue - totalAmount);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [cashValue, totalAmount, paymentType]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Validation based on payment type
    if (paymentType === 'full') {
      if (!isNaN(cashValue) && cashValue >= totalAmount) {
        setIsSubmitting(true);
        onSubmit(cashValue, false);
      }
    } else {
      // Down payment: must be greater than 0 and less than total
      if (!isNaN(cashValue) && cashValue > 0 && cashValue <= totalAmount) {
        setIsSubmitting(true);
        onSubmit(cashValue, true);
      }
    }
  };

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  // Calculate remaining balance for down payment
  const remainingBalance = useMemo(() => 
    paymentType === 'down_payment' && cashValue > 0 
      ? totalAmount - cashValue 
      : 0,
    [paymentType, cashValue, totalAmount]
  );

  // Check if submit button should be enabled
  const isSubmitEnabled = useMemo(() => {
    if (isNaN(cashValue) || isSubmitting) return false;
    
    if (paymentType === 'full') {
      return cashValue >= totalAmount;
    } else {
      return cashValue > 0 && cashValue <= totalAmount;
    }
  }, [cashValue, isSubmitting, paymentType, totalAmount]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="cash-payment-description">
        <DialogHeader>
          <DialogTitle>Pembayaran Tunai</DialogTitle>
          <DialogDescription id="cash-payment-description">
            Pilih jenis pembayaran dan masukkan jumlah uang tunai yang diterima.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-3xl font-bold text-primary">
                Rp {formatCurrency(totalAmount)}
              </p>
            </div>

            <Separator />

            {/* Payment Type Selection */}
            <div className="space-y-3">
              <Label>Jenis Pembayaran</Label>
              <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'full' | 'down_payment')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Bayar Penuh</p>
                      <p className="text-xs text-muted-foreground">Bayar seluruh tagihan sekarang</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="down_payment" id="down_payment" />
                  <Label htmlFor="down_payment" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Uang Muka (DP)</p>
                      <p className="text-xs text-muted-foreground">Bayar sebagian, sisanya nanti</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="cash-received">
                {paymentType === 'full' ? 'Uang Diterima' : 'Jumlah Uang Muka (DP)'}
              </Label>
              <Input
                id="cash-received"
                ref={inputRef}
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="text-lg h-12 text-center"
                placeholder={paymentType === 'full' ? "Contoh: 50000" : "Masukkan jumlah DP"}
                min={paymentType === 'full' ? totalAmount : 1}
                max={paymentType === 'down_payment' ? totalAmount : undefined}
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
                  disabled={paymentType === 'full' ? amount < totalAmount : amount > totalAmount}
                >
                  {amount >= 1000000 ? `${amount / 1000000}jt` : `${amount / 1000}rb`}
                </Button>
              ))}
            </div>

            {/* Full Payment - Show change */}
            {paymentType === 'full' && cashValue >= totalAmount && change > 0 && (
              <div className="text-center p-4 bg-pos-success/10 rounded-lg border border-pos-success/30">
                <p className="text-sm text-pos-success font-medium">Kembalian</p>
                <p className="text-2xl font-bold text-pos-success">
                  Rp {formatCurrency(change)}
                </p>
              </div>
            )}

            {paymentType === 'full' && cashValue >= totalAmount && change === 0 && (
              <div className="text-center p-4 bg-pos-highlight/20 rounded-lg border border-pos-highlight/60">
                <p className="text-sm text-primary font-medium">Uang Pas</p>
                <p className="text-lg font-semibold text-primary">
                  Tidak ada kembalian
                </p>
              </div>
            )}

            {paymentType === 'full' && cashValue > 0 && cashValue < totalAmount && (
              <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm text-destructive font-medium">Uang Kurang</p>
                <p className="text-lg font-semibold text-destructive">
                  Kurang Rp {formatCurrency(totalAmount - cashValue)}
                </p>
              </div>
            )}

            {/* Down Payment - Show remaining balance */}
            {paymentType === 'down_payment' && cashValue > 0 && cashValue <= totalAmount && (
              <div className="space-y-2">
                <div className="text-center p-4 bg-pos-warning/10 rounded-lg border border-pos-warning/30">
                  <p className="text-sm text-pos-warning font-medium">Uang Muka (DP)</p>
                  <p className="text-2xl font-bold text-pos-warning">
                    Rp {formatCurrency(cashValue)}
                  </p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary font-medium">Sisa Pembayaran</p>
                  <p className="text-2xl font-bold text-primary">
                    Rp {formatCurrency(remainingBalance)}
                  </p>
                  <p className="text-xs text-primary/70 mt-1">
                    Akan dibayar saat pengambilan
                  </p>
                </div>
              </div>
            )}

            {paymentType === 'down_payment' && cashValue > totalAmount && (
              <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm text-destructive font-medium">Jumlah Melebihi Total</p>
                <p className="text-sm text-destructive/80">
                  DP tidak boleh melebihi total pembayaran
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={!isSubmitEnabled}
            >
              {isSubmitting ? 'Memproses...' : paymentType === 'full' ? 'Konfirmasi Pembayaran' : 'Konfirmasi DP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
