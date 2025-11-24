import { WebPlugin } from '@capacitor/core';
import type { ThermalPrinterPlugin } from './ThermalPrinter';

export class ThermalPrinterWeb extends WebPlugin implements ThermalPrinterPlugin {
  async requestPermissions(): Promise<{ granted: boolean }> {
    // Web Bluetooth is available in browser, permissions handled by browser
    return { granted: true };
  }

  async listPairedDevices(): Promise<{ devices: Array<{ name: string; address: string }> }> {
    throw this.unimplemented('listPairedDevices is not available on web. Use Web Bluetooth API directly.');
  }

  async connect(options: { address: string }): Promise<{ 
    connected: boolean; 
    deviceName: string; 
    deviceAddress: string 
  }> {
    throw this.unimplemented('connect is not available on web. Use Web Bluetooth API directly.');
  }

  async disconnect(): Promise<{ disconnected: boolean }> {
    throw this.unimplemented('disconnect is not available on web. Use Web Bluetooth API directly.');
  }

  async isConnected(): Promise<{ 
    connected: boolean; 
    deviceName?: string; 
    deviceAddress?: string 
  }> {
    throw this.unimplemented('isConnected is not available on web. Use Web Bluetooth API directly.');
  }

  async printRaw(options: { data: number[] }): Promise<{ success: boolean; bytesSent: number }> {
    throw this.unimplemented('printRaw is not available on web. Use Web Bluetooth API directly.');
  }

  async printText(options: { text: string }): Promise<{ success: boolean }> {
    throw this.unimplemented('printText is not available on web. Use Web Bluetooth API directly.');
  }
}
