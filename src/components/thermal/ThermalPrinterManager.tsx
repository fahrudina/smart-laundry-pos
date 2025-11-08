import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bluetooth, 
  Printer, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  isBluetoothSupported,
  isThermerAppAvailable,
  printToThermalPrinter,
  printToThermerApp,
  fetchReceiptDataForThermal
} from '@/lib/printUtils';
import { useThermalPrinter } from '@/contexts/ThermalPrinterContext';

interface ThermalPrinterManagerProps {
  orderId?: string;
  onPrintSuccess?: () => void;
  onPrintError?: (error: string) => void;
}

export const ThermalPrinterManager: React.FC<ThermalPrinterManagerProps> = ({
  orderId,
  onPrintSuccess,
  onPrintError
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Use thermal printer context for global connection management
  const { 
    printerConnection, 
    connectionStatus, 
    isConnecting, 
    lastError, 
    connect: connectPrinter, 
    disconnect: disconnectPrinter, 
    clearError 
  } = useThermalPrinter();

  const handleConnect = useCallback(async () => {
    clearError();
    await connectPrinter();
  }, [clearError, connectPrinter]);

  const handleDisconnect = useCallback(() => {
    disconnectPrinter();
  }, [disconnectPrinter]);

  const handlePrintBluetooth = useCallback(async () => {
    if (!printerConnection || !orderId) {
      return;
    }

    setIsPrinting(true);
    clearError();

    try {
      // Fetch receipt data
      const receiptData = await fetchReceiptDataForThermal(orderId);
      
      // Print to thermal printer
      await printToThermalPrinter(receiptData, printerConnection, {
        paperWidth: 32,
        cutPaper: true,
        feedLines: 3
      });

      toast.success('🖨️ Struk berhasil dicetak!');
      if (onPrintSuccess) {
        onPrintSuccess();
      }
    } catch (error) {
      console.error('❌ Print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Pencetakan gagal';
      toast.error(`❌ Pencetakan gagal: ${errorMessage}`);
      if (onPrintError) {
        onPrintError(errorMessage);
      }
    } finally {
      setIsPrinting(false);
    }
  }, [printerConnection, orderId, onPrintSuccess, onPrintError, clearError]);

  const handlePrintThermer = useCallback(async () => {
    if (!orderId) return;

    setIsPrinting(true);
    clearError();

    try {
      // Fetch receipt data
      const receiptData = await fetchReceiptDataForThermal(orderId);
      
      // Print via Thermer app
      await printToThermerApp(receiptData);

      toast.success('📱 Struk berhasil dikirim ke aplikasi Thermer!');
      if (onPrintSuccess) {
        onPrintSuccess();
      }
    } catch (error) {
      console.error('Thermer print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Pencetakan Thermer gagal';
      toast.error(`❌ Pencetakan Thermer gagal: ${errorMessage}`);
      if (onPrintError) {
        onPrintError(errorMessage);
      }
    } finally {
      setIsPrinting(false);
    }
  }, [orderId, onPrintSuccess, onPrintError, clearError]);

  const bluetoothSupported = isBluetoothSupported();
  const thermerAvailable = isThermerAppAvailable();

  if (!bluetoothSupported && !thermerAvailable) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Pencetakan thermal tidak didukung di perangkat ini. Silakan gunakan pencetakan browser atau ekspor PDF sebagai gantinya.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Printer className="h-5 w-5" />
          <span>Printer Thermal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bluetooth Printing Section */}
        {bluetoothSupported && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bluetooth className="h-4 w-4" />
                <span className="font-medium">Bluetooth Direct</span>
              </div>
              <Badge 
                variant={connectionStatus === 'connected' ? 'default' : 
                        connectionStatus === 'error' ? 'destructive' : 'secondary'}
                className="flex items-center space-x-1"
              >
                {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
                {connectionStatus === 'error' && <XCircle className="h-3 w-3" />}
                <span>
                  {connectionStatus === 'connected' ? 'Terhubung' :
                   connectionStatus === 'error' ? 'Error' : 'Terputus'}
                </span>
              </Badge>
            </div>

            <div className="flex space-x-2">
              {connectionStatus === 'disconnected' && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />}
                  <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Printer'}</span>
                </Button>
              )}

              {connectionStatus === 'connected' && (
                <>
                  <Button
                    onClick={handlePrintBluetooth}
                    disabled={isPrinting || !orderId}
                    className="flex items-center space-x-2"
                    size="sm"
                  >
                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    <span>{isPrinting ? 'Mencetak...' : 'Cetak Struk'}</span>
                  </Button>

                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Putuskan</span>
                  </Button>
                </>
              )}

              {connectionStatus === 'error' && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  <span>{isConnecting ? 'Mencoba Lagi...' : 'Coba Lagi'}</span>
                </Button>
              )}
            </div>

            {printerConnection && (
              <div className="text-sm text-muted-foreground">
                <p>Terhubung ke: {printerConnection.device.name || printerConnection.device.id}</p>
              </div>
            )}
          </div>
        )}

        {/* Separator if both options are available */}
        {bluetoothSupported && thermerAvailable && (
          <Separator />
        )}

        {/* Thermer App Section */}
        {thermerAvailable && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span className="font-medium">Integrasi Aplikasi Thermer</span>
              <Badge variant="outline">Direkomendasikan</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Gunakan aplikasi Thermer sebagai jembatan untuk mencetak ke berbagai printer thermal Bluetooth.
            </p>

            <Button
              onClick={handlePrintThermer}
              disabled={isPrinting || !orderId}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 w-full"
            >
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              <span>{isPrinting ? 'Mengirim ke Thermer...' : 'Cetak via Aplikasi Thermer'}</span>
            </Button>
          </div>
        )}

        {/* Error Display */}
        {lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Pastikan printer thermal Anda menyala dan dalam mode pairing</p>
          <p>• Untuk hasil terbaik, gunakan kertas thermal 58mm</p>
          <p>• Aplikasi Thermer mendukung lebih banyak model printer dan lebih mudah diatur</p>
        </div>
      </CardContent>
    </Card>
  );
};