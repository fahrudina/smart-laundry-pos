import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { 
  connectThermalPrinter,
  disconnectThermalPrinter,
  ThermalPrinterConnection
} from '@/lib/printUtils';

interface ThermalPrinterContextType {
  printerConnection: ThermalPrinterConnection | null;
  connectionStatus: 'disconnected' | 'connected' | 'error';
  isConnecting: boolean;
  lastError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

const ThermalPrinterContext = createContext<ThermalPrinterContextType | undefined>(undefined);

interface ThermalPrinterProviderProps {
  children: ReactNode;
}

export const ThermalPrinterProvider: React.FC<ThermalPrinterProviderProps> = ({ children }) => {
  const [printerConnection, setPrinterConnection] = useState<ThermalPrinterConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  // Monitor connection status
  useEffect(() => {
    if (printerConnection?.server?.connected) {
      setConnectionStatus('connected');
    } else if (printerConnection) {
      // Connection object exists but server is disconnected
      setConnectionStatus('disconnected');
      setPrinterConnection(null);
    }
  }, [printerConnection]);

  // Listen for Bluetooth device disconnection events
  useEffect(() => {
    if (printerConnection?.device) {
      const handleDisconnect = () => {
        console.log('🔌 Bluetooth device disconnected');
        setPrinterConnection(null);
        setConnectionStatus('disconnected');
        toast.info('🔌 Thermal printer disconnected');
      };

      printerConnection.device.addEventListener('gattserverdisconnected', handleDisconnect);

      return () => {
        printerConnection.device.removeEventListener('gattserverdisconnected', handleDisconnect);
      };
    }
  }, [printerConnection]);

  const connect = useCallback(async () => {
    if (isConnecting || connectionStatus === 'connected') {
      return;
    }

    setIsConnecting(true);
    setLastError(null);

    try {
      console.log('🔗 Connecting to thermal printer...');
      const connection = await connectThermalPrinter();
      setPrinterConnection(connection);
      setConnectionStatus('connected');
      toast.success('✅ Connected to thermal printer!');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      setConnectionStatus('error');
      toast.error(`❌ Connection failed: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, connectionStatus]);

  const disconnect = useCallback(() => {
    if (printerConnection) {
      console.log('🔌 Disconnecting thermal printer...');
      disconnectThermalPrinter(printerConnection);
      setPrinterConnection(null);
      setConnectionStatus('disconnected');
      toast.success('🔌 Disconnected from thermal printer');
    }
  }, [printerConnection]);

  const clearError = useCallback(() => {
    setLastError(null);
    if (connectionStatus === 'error') {
      setConnectionStatus('disconnected');
    }
  }, [connectionStatus]);

  const contextValue: ThermalPrinterContextType = {
    printerConnection,
    connectionStatus,
    isConnecting,
    lastError,
    connect,
    disconnect,
    clearError,
  };

  return (
    <ThermalPrinterContext.Provider value={contextValue}>
      {children}
    </ThermalPrinterContext.Provider>
  );
};

export const useThermalPrinter = (): ThermalPrinterContextType => {
  const context = useContext(ThermalPrinterContext);
  if (context === undefined) {
    throw new Error('useThermalPrinter must be used within a ThermalPrinterProvider');
  }
  return context;
};