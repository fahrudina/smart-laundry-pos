import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThermalPrinterManager } from '@/components/thermal/ThermalPrinterManager';
import type { LocalReceiptData } from '@/lib/printUtils';

interface ThermalPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  customerName?: string;
  // In-memory receipt for an offline order that hasn't synced to Supabase
  // yet - bypasses the get_receipt_data RPC, which requires a
  // server-confirmed order.
  localReceiptData?: LocalReceiptData;
}

export const ThermalPrintDialog: React.FC<ThermalPrintDialogProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName,
  localReceiptData
}) => {
  const handlePrintSuccess = () => {
    // Keep dialog open so user can print more receipts if needed
    // They can manually close it when done
  };

  const handlePrintError = (error: string) => {
    // Error is already shown in the ThermalPrinterManager component
    console.error('Thermal print error:', error);
  };

  // For an offline order, orderId is null (it hasn't synced to Supabase
  // yet) but localReceiptData carries its local id - fall back to that so
  // the description still shows the specific receipt being printed
  // instead of the generic "connect your printer" message.
  const displayOrderId = orderId || localReceiptData?.orderId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thermal Printer</DialogTitle>
          <DialogDescription>
            {customerName && displayOrderId ? (
              <>Print receipt for <strong>{customerName}</strong> (Order #{displayOrderId})</>
            ) : displayOrderId ? (
              <>Print receipt for Order #{displayOrderId}</>
            ) : (
              'Connect to your thermal printer to print receipts'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ThermalPrinterManager
          orderId={orderId || undefined}
          localReceiptData={localReceiptData}
          onPrintSuccess={handlePrintSuccess}
          onPrintError={handlePrintError}
        />
      </DialogContent>
    </Dialog>
  );
};