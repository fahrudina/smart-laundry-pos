import React from 'react';
import { CheckCircle, Printer, X } from 'lucide-react';
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
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="p-8 pb-6">
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
        </DialogHeader>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-3">
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
