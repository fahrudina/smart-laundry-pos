import React, { useState, useCallback, useEffect } from 'react';
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
  connectThermalPrinter,
  disconnectThermalPrinter,
  printToThermalPrinter,
  printToThermerApp,
  fetchReceiptDataForThermal,
  ThermalPrinterConnection
} from '@/lib/printUtils';

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
  const [printerConnection, setPrinterConnection] = useState<ThermalPrinterConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    if (printerConnection?.server?.connected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [printerConnection]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setLastError(null);

    try {
      const connection = await connectThermalPrinter();
      setPrinterConnection(connection);
      setConnectionStatus('connected');
      toast.success('✅ Connected to thermal printer!');
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      setConnectionStatus('error');
      toast.error(`❌ Connection failed: ${errorMessage}`);
      if (onPrintError) {
        onPrintError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [onPrintError]);

  const handleDisconnect = useCallback(() => {
    if (printerConnection) {
      disconnectThermalPrinter(printerConnection);
      setPrinterConnection(null);
      setConnectionStatus('disconnected');
      toast.success('🔌 Disconnected from thermal printer');
    }
  }, [printerConnection]);

  const handlePrintBluetooth = useCallback(async () => {
    if (!printerConnection || !orderId) return;

    setIsPrinting(true);
    setLastError(null);

    try {
      // Fetch receipt data
      const receiptData = await fetchReceiptDataForThermal(orderId);
      
      // Print to thermal printer
      await printToThermalPrinter(receiptData, printerConnection, {
        paperWidth: 32,
        cutPaper: true,
        feedLines: 3
      });

      toast.success('🖨️ Receipt printed successfully!');
      if (onPrintSuccess) {
        onPrintSuccess();
      }
    } catch (error) {
      console.error('Print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      setLastError(errorMessage);
      toast.error(`❌ Print failed: ${errorMessage}`);
      if (onPrintError) {
        onPrintError(errorMessage);
      }
    } finally {
      setIsPrinting(false);
    }
  }, [printerConnection, orderId, onPrintSuccess, onPrintError]);

  const handlePrintThermer = useCallback(async () => {
    if (!orderId) return;

    setIsPrinting(true);
    setLastError(null);

    try {
      // Fetch receipt data
      const receiptData = await fetchReceiptDataForThermal(orderId);
      
      // Print via Thermer app
      await printToThermerApp(receiptData);

      toast.success('📱 Receipt sent to Thermer app!');
      if (onPrintSuccess) {
        onPrintSuccess();
      }
    } catch (error) {
      console.error('Thermer print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Thermer print failed';
      setLastError(errorMessage);
      toast.error(`❌ Thermer print failed: ${errorMessage}`);
      if (onPrintError) {
        onPrintError(errorMessage);
      }
    } finally {
      setIsPrinting(false);
    }
  }, [orderId, onPrintSuccess, onPrintError]);

  const bluetoothSupported = isBluetoothSupported();
  const thermerAvailable = isThermerAppAvailable();

  if (!bluetoothSupported && !thermerAvailable) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Thermal printing is not supported on this device. Please use browser printing or PDF export instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Printer className="h-5 w-5" />
          <span>Thermal Printer</span>
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
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'error' ? 'Error' : 'Disconnected'}
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
                  <span>{isConnecting ? 'Connecting...' : 'Connect Printer'}</span>
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
                    <span>{isPrinting ? 'Printing...' : 'Print Receipt'}</span>
                  </Button>

                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Disconnect</span>
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
                  <span>{isConnecting ? 'Retrying...' : 'Retry Connection'}</span>
                </Button>
              )}
            </div>

            {printerConnection && (
              <div className="text-sm text-muted-foreground">
                <p>Connected to: {printerConnection.device.name || printerConnection.device.id}</p>
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
              <span className="font-medium">Thermer App Integration</span>
              <Badge variant="outline">Recommended</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Use the Thermer app as a bridge to print to various Bluetooth thermal printers.
            </p>

            <Button
              onClick={handlePrintThermer}
              disabled={isPrinting || !orderId}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 w-full"
            >
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              <span>{isPrinting ? 'Sending to Thermer...' : 'Print via Thermer App'}</span>
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
          <p>• Ensure your thermal printer is turned on and in pairing mode</p>
          <p>• For best results, use 58mm thermal paper</p>
          <p>• Thermer app supports more printer models and is easier to set up</p>
        </div>
      </CardContent>
    </Card>
  );
};