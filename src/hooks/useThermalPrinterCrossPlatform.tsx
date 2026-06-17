// Example: How to update your existing thermal printer components to support Android

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  isAndroid,
  isNativePlatform,
  requestBluetoothPermissions,
  listPairedPrinters,
  connectNativePrinter,
  disconnectNativePrinter,
  isNativePrinterConnected,
  printReceipt,
  type ThermalPrinterConnection,
  connectThermalPrinter,
  disconnectThermalPrinter,
} from '@/lib/printUtilsPlatform';

// Updated hook for cross-platform thermal printer support
export function useThermalPrinterCrossPlatform() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [webConnection, setWebConnection] = useState<ThermalPrinterConnection | null>(null);
  const [pairedDevices, setPairedDevices] = useState<Array<{ name: string; address: string }>>([]);

  // Check connection status on mount
  useEffect(() => {
    if (isAndroid()) {
      checkNativeConnection();
      loadPairedDevices();
    }
  }, []);

  const checkNativeConnection = async () => {
    if (isAndroid()) {
      const connected = await isNativePrinterConnected();
      setIsConnected(connected);
    }
  };

  const loadPairedDevices = async () => {
    if (isAndroid()) {
      try {
        const devices = await listPairedPrinters();
        setPairedDevices(devices);
      } catch (error) {
        console.error('Failed to load paired devices:', error);
      }
    }
  };

  const connect = async (deviceAddress?: string) => {
    setIsConnecting(true);
    try {
      if (isAndroid()) {
        // Android: Request permissions first
        const granted = await requestBluetoothPermissions();
        if (!granted) {
          toast.error('Bluetooth permissions required');
          return;
        }

        // If no device address provided, try to connect to first paired device
        if (!deviceAddress) {
          const devices = await listPairedPrinters();
          if (devices.length === 0) {
            toast.error('No paired printers found. Please pair your printer in Bluetooth settings.');
            return;
          }
          deviceAddress = devices[0].address;
        }

        // Connect to native printer
        const connection = await connectNativePrinter(deviceAddress);
        setConnectedDevice(connection.deviceName);
        setIsConnected(true);
        toast.success(`Connected to ${connection.deviceName}`);
      } else {
        // Browser: Use Web Bluetooth
        const connection = await connectThermalPrinter();
        setWebConnection(connection);
        setConnectedDevice(connection.device.name || 'Unknown Printer');
        setIsConnected(true);
        toast.success('Connected to thermal printer');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (isAndroid()) {
        await disconnectNativePrinter();
      } else if (webConnection) {
        disconnectThermalPrinter(webConnection);
        setWebConnection(null);
      }
      setIsConnected(false);
      setConnectedDevice(null);
      toast.success('Disconnected from printer');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  const print = async (orderId: string) => {
    if (!isConnected) {
      toast.error('No printer connected');
      return;
    }

    try {
      toast.info('Printing receipt...');
      
      if (isAndroid()) {
        // Android native printing
        await printReceipt(orderId, { deviceName: '', deviceAddress: '' });
      } else if (webConnection) {
        // Web Bluetooth printing
        await printReceipt(orderId, webConnection);
      }
      
      toast.success('Receipt printed successfully!');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error(`Failed to print: ${error.message}`);
    }
  };

  return {
    isConnected,
    isConnecting,
    connectedDevice,
    pairedDevices,
    isAndroid: isAndroid(),
    connect,
    disconnect,
    print,
    refreshPairedDevices: loadPairedDevices,
  };
}

// Example usage in a React component:
/*
import { useThermalPrinterCrossPlatform } from './useThermalPrinterCrossPlatform';

function PrintButton({ orderId }: { orderId: string }) {
  const {
    isConnected,
    isConnecting,
    connectedDevice,
    pairedDevices,
    isAndroid,
    connect,
    disconnect,
    print,
  } = useThermalPrinterCrossPlatform();

  return (
    <div className="flex gap-2">
      {!isConnected ? (
        <>
          {isAndroid && pairedDevices.length > 0 ? (
            <select 
              onChange={(e) => connect(e.target.value)}
              className="px-4 py-2 rounded"
            >
              <option value="">Select Printer</option>
              {pairedDevices.map(device => (
                <option key={device.address} value={device.address}>
                  {device.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => connect()}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {isConnecting ? 'Connecting...' : 'Connect Printer'}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="text-sm text-gray-600">
            Connected: {connectedDevice}
          </div>
          <button
            onClick={() => print(orderId)}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Print Receipt
          </button>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}
*/
