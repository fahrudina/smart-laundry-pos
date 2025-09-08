import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThermalPrinterManager } from '@/components/thermal/ThermalPrinterManager';

interface ThermalPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  customerName?: string;
}

export const ThermalPrintDialog: React.FC<ThermalPrintDialogProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName
}) => {
  const handlePrintSuccess = () => {
    // Keep dialog open so user can print more receipts if needed
    // They can manually close it when done
  };

  const handlePrintError = (error: string) => {
    // Error is already shown in the ThermalPrinterManager component
    console.error('Thermal print error:', error);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thermal Printer</DialogTitle>
          <DialogDescription>
            {customerName && orderId ? (
              <>Print receipt for <strong>{customerName}</strong> (Order #{orderId})</>
            ) : orderId ? (
              <>Print receipt for Order #{orderId}</>
            ) : (
              'Connect to your thermal printer to print receipts'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ThermalPrinterManager
          orderId={orderId || undefined}
          onPrintSuccess={handlePrintSuccess}
          onPrintError={handlePrintError}
        />
      </DialogContent>
    </Dialog>
  );
};