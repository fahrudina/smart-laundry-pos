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

interface CashPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (cashReceived: number) => void;
}

export const CashPaymentDialog: React.FC<CashPaymentDialogProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onSubmit,
}) => {
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setCashReceived('');
      setChange(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= totalAmount) {
      setChange(cash - totalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, totalAmount]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= totalAmount) {
      onSubmit(cash);
    }
  };

  const quickCashOptions = [50000, 100000, 150000, 200000];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="cash-payment-description">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Pembayaran Tunai</DialogTitle>
            <DialogDescription id="cash-payment-description">
              Masukkan jumlah uang tunai yang diterima dari pelanggan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-3xl font-bold text-blue-600">
                Rp {formatCurrency(totalAmount)}
              </p>
            </div>
            
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
                min={totalAmount}
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
                  disabled={amount < totalAmount}
                >
                  {amount >= 1000000 ? `${amount / 1000000}jt` : `${amount / 1000}rb`}
                </Button>
              ))}
            </div>
            
            {parseFloat(cashReceived) >= totalAmount && change > 0 && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Kembalian</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {formatCurrency(change)}
                </p>
              </div>
            )}
            
            {parseFloat(cashReceived) >= totalAmount && change === 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Uang Pas</p>
                <p className="text-lg font-semibold text-blue-600">
                  Tidak ada kembalian
                </p>
              </div>
            )}
            
            {parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < totalAmount && (
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium">Uang Kurang</p>
                <p className="text-lg font-semibold text-red-600">
                  Kurang Rp {formatCurrency(totalAmount - parseFloat(cashReceived))}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={parseFloat(cashReceived) < totalAmount}
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
