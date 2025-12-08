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
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash)) {
      if (paymentType === 'full' && cash >= totalAmount) {
        setChange(cash - totalAmount);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [cashReceived, totalAmount, paymentType]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    const cash = parseFloat(cashReceived);

    // Validation based on payment type
    if (paymentType === 'full') {
      if (!isNaN(cash) && cash >= totalAmount) {
        setIsSubmitting(true);
        onSubmit(cash, false);
      }
    } else {
      // Down payment: must be greater than 0 and less than total
      if (!isNaN(cash) && cash > 0 && cash <= totalAmount) {
        setIsSubmitting(true);
        onSubmit(cash, true);
      }
    }
  };

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  // Calculate remaining balance for down payment
  const remainingBalance = paymentType === 'down_payment' && parseFloat(cashReceived) > 0 
    ? totalAmount - parseFloat(cashReceived) 
    : 0;

  // Check if submit button should be enabled
  const isSubmitEnabled = () => {
    const cash = parseFloat(cashReceived);
    if (isNaN(cash) || isSubmitting) return false;
    
    if (paymentType === 'full') {
      return cash >= totalAmount;
    } else {
      return cash > 0 && cash <= totalAmount;
    }
  };

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
              <p className="text-3xl font-bold text-blue-600">
                Rp {formatCurrency(totalAmount)}
              </p>
            </div>

            <Separator />

            {/* Payment Type Selection */}
            <div className="space-y-3">
              <Label>Jenis Pembayaran</Label>
              <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'full' | 'down_payment')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Bayar Penuh</p>
                      <p className="text-xs text-muted-foreground">Bayar seluruh tagihan sekarang</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
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
                max={totalAmount}
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
            {paymentType === 'full' && parseFloat(cashReceived) >= totalAmount && change > 0 && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Kembalian</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {formatCurrency(change)}
                </p>
              </div>
            )}

            {paymentType === 'full' && parseFloat(cashReceived) >= totalAmount && change === 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Uang Pas</p>
                <p className="text-lg font-semibold text-blue-600">
                  Tidak ada kembalian
                </p>
              </div>
            )}

            {paymentType === 'full' && parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < totalAmount && (
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium">Uang Kurang</p>
                <p className="text-lg font-semibold text-red-600">
                  Kurang Rp {formatCurrency(totalAmount - parseFloat(cashReceived))}
                </p>
              </div>
            )}

            {/* Down Payment - Show remaining balance */}
            {paymentType === 'down_payment' && parseFloat(cashReceived) > 0 && parseFloat(cashReceived) <= totalAmount && (
              <div className="space-y-2">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700 font-medium">Uang Muka (DP)</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    Rp {formatCurrency(parseFloat(cashReceived))}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">Sisa Pembayaran</p>
                  <p className="text-2xl font-bold text-orange-600">
                    Rp {formatCurrency(remainingBalance)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Akan dibayar saat pengambilan
                  </p>
                </div>
              </div>
            )}

            {paymentType === 'down_payment' && parseFloat(cashReceived) > totalAmount && (
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium">Jumlah Melebihi Total</p>
                <p className="text-sm text-red-600">
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
              disabled={!isSubmitEnabled()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Memproses...' : paymentType === 'full' ? 'Konfirmasi Pembayaran' : 'Konfirmasi DP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
