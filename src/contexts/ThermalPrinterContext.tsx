import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  disconnect: () => Promise<void>;
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

  const connect = useCallback(async () => {
    if (isConnecting || connectionStatus === 'connected') {
      return;
    }

    setIsConnecting(true);
    setLastError(null);

    try {
      const connection = await connectThermalPrinter((disconnectedDeviceId) => {
        setPrinterConnection((current) => (current?.deviceId === disconnectedDeviceId ? null : current));
        setConnectionStatus((current) => (current === 'connected' ? 'disconnected' : current));
        toast.info('🔌 Thermal printer disconnected');
      });
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

  const disconnect = useCallback(async () => {
    if (printerConnection) {
      await disconnectThermalPrinter(printerConnection);
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