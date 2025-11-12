import React from 'react';
import { CheckCircle, Printer, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OrderSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  customerName: string;
  whatsAppSent: boolean;
  pointsEarned?: number;
  onPrintReceipt: () => void;
  onNewTransaction: () => void;
}

export const OrderSuccessDialog: React.FC<OrderSuccessDialogProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  paymentMethod,
  customerName,
  whatsAppSent,
  pointsEarned,
  onPrintReceipt,
  onNewTransaction,
}) => {
  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'cash': 'TUNAI',
      'qris': 'QRIS',
      'transfer': 'TRANSFER',
      'debit': 'DEBIT',
      'credit': 'CREDIT',
      'pending': 'BAYAR NANTI',
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-20 w-20 text-white stroke-[3]" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {formatPaymentMethod(paymentMethod)}
            </h2>
          </div>

          {/* Order Information */}
          <div className="space-y-4">
            {/* Invoice Number */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Nomor Invoice</p>
              <p className="text-2xl font-bold text-gray-900 break-all">
                {orderNumber}
              </p>
            </div>

            {/* Total Amount */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Harga</p>
              <p className="text-3xl font-bold text-gray-900">
                Rp {totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* WhatsApp Confirmation */}
          {whatsAppSent && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Receipt sent to member via WhatsApp
                </span>
              </div>
            </div>
          )}

          {/* Points Earned */}
          {pointsEarned && pointsEarned > 0 && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full">
                  <Star className="h-5 w-5 text-white fill-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-amber-700 font-medium">Pelanggan mendapat</p>
                  <p className="text-2xl font-bold text-amber-600">+{pointsEarned} Poin</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 text-center mt-2">
                🎉 Poin dapat digunakan untuk diskon pada transaksi berikutnya
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {/* Print Receipt Button */}
          <Button
            onClick={onPrintReceipt}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
            size="lg"
          >
            <Printer className="h-5 w-5 mr-2" />
            Cetak faktur
          </Button>

          {/* New Transaction Button */}
          <Button
            onClick={onNewTransaction}
            variant="outline"
            className="w-full py-6 text-lg font-semibold border-2"
            size="lg"
          >
            Transaksi baru
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
