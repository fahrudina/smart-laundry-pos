import { registerPlugin } from '@capacitor/core';

export interface ThermalPrinterPlugin {
  /**
   * Request Bluetooth permissions
   */
  requestPermissions(): Promise<{ granted: boolean }>;

  /**
   * List all paired Bluetooth devices
   */
  listPairedDevices(): Promise<{ devices: Array<{ name: string; address: string }> }>;

  /**
   * Connect to a thermal printer by address
   */
  connect(options: { address: string }): Promise<{ 
    connected: boolean; 
    deviceName: string; 
    deviceAddress: string 
  }>;

  /**
   * Disconnect from the thermal printer
   */
  disconnect(): Promise<{ disconnected: boolean }>;

  /**
   * Check if printer is connected
   */
  isConnected(): Promise<{ 
    connected: boolean; 
    deviceName?: string; 
    deviceAddress?: string 
  }>;

  /**
   * Print raw bytes to thermal printer
   */
  printRaw(options: { data: number[] }): Promise<{ success: boolean; bytesSent: number }>;

  /**
   * Print text to thermal printer
   */
  printText(options: { text: string }): Promise<{ success: boolean }>;
}

const ThermalPrinter = registerPlugin<ThermalPrinterPlugin>('ThermalPrinter', {
  web: () => import('./ThermalPrinterWeb').then(m => new m.ThermalPrinterWeb()),
});

export default ThermalPrinter;
