import { Capacitor } from '@capacitor/core';
import ThermalPrinter from '@/plugins/ThermalPrinter';
import {
  ThermalPrinterConnection,
  connectThermalPrinter as connectWebBluetooth,
  disconnectThermalPrinter as disconnectWebBluetooth,
  printToThermalPrinter as printWebBluetooth,
  fetchReceiptDataForThermal,
} from './printUtils';

// ESC/POS Commands for native printing
const ESC = 0x1b;
const GS = 0x1d;

const ESC_POS = {
  INIT: [ESC, 0x40],
  BOLD_ON: [ESC, 0x45, 1],
  BOLD_OFF: [ESC, 0x45, 0],
  ALIGN_LEFT: [ESC, 'a'.charCodeAt(0), 0],
  ALIGN_CENTER: [ESC, 'a'.charCodeAt(0), 1],
  ALIGN_RIGHT: [ESC, 'a'.charCodeAt(0), 2],
  SIZE_NORMAL: [GS, '!'.charCodeAt(0), 0],
  SIZE_DOUBLE_WIDTH: [GS, '!'.charCodeAt(0), 0x10],
  SIZE_DOUBLE_HEIGHT: [GS, '!'.charCodeAt(0), 0x01],
  SIZE_DOUBLE: [GS, '!'.charCodeAt(0), 0x11],
  LF: [0x0a],
  CR: [0x0d],
  CRLF: [0x0d, 0x0a],
  CUT: [GS, 'V'.charCodeAt(0), 1],
  FEED_LINE: [ESC, 'd'.charCodeAt(0), 3],
};

interface NativePrinterConnection {
  deviceName: string;
  deviceAddress: string;
}

interface ThermalPrintOptions {
  paperWidth?: number;
  cutPaper?: boolean;
  feedLines?: number;
}

/**
 * Check if running on native Android/iOS
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on Android specifically
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Convert text to byte array
 */
const textToBytes = (text: string): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }
  return bytes;
};

/**
 * Combine multiple byte arrays
 */
const combineBytes = (...arrays: number[][]): number[] => {
  return arrays.flat();
};

/**
 * Format text for thermal printer
 */
const formatTextForThermal = (text: string, width: number = 32): string => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word.substring(0, width));
        currentLine = word.substring(width);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
};

/**
 * Center text within specified width
 */
const centerText = (text: string, width: number = 32): string => {
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
};

/**
 * Create a line separator
 */
const createLine = (char: string = '-', width: number = 32): string => {
  return char.repeat(width);
};

/**
 * Format receipt data for thermal printing
 */
const formatReceiptForNativePrinting = (receiptData: any, options: ThermalPrintOptions = {}): number[] => {
  const { paperWidth = 32 } = options;
  const commands: number[][] = [];
  
  // Initialize printer
  commands.push(ESC_POS.INIT);
  
  // Store Header
  commands.push(ESC_POS.ALIGN_CENTER);
  commands.push(ESC_POS.SIZE_DOUBLE);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(centerText(receiptData.storeName || 'SMART LAUNDRY POS', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(ESC_POS.SIZE_NORMAL);
  
  // Store details
  if (receiptData.storeAddress) {
    commands.push(textToBytes(centerText(formatTextForThermal(receiptData.storeAddress, paperWidth), paperWidth)));
    commands.push(ESC_POS.CRLF);
  }
  
  if (receiptData.storePhone) {
    commands.push(textToBytes(centerText(`No. HP ${receiptData.storePhone}`, paperWidth)));
    commands.push(ESC_POS.CRLF);
  }
  
  // Separator
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Order ID
  commands.push(ESC_POS.ALIGN_LEFT);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(`ORDER ID: ${receiptData.orderId || ''}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  // Customer name
  commands.push(ESC_POS.BOLD_ON);
  commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
  commands.push(textToBytes(`${receiptData.customerName || 'CUSTOMER'}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(ESC_POS.SIZE_NORMAL);
  
  if (receiptData.customerPhone) {
    const maskedPhone = receiptData.customerPhone.replace(/(\d{2,3})\d{4}(\d{2,3})/, '$1****$2');
    commands.push(textToBytes(`No. HP: ${maskedPhone}`));
    commands.push(ESC_POS.CRLF);
  }
  
  commands.push(ESC_POS.CRLF);
  
  // Date
  const orderDate = receiptData.orderDate ? new Date(receiptData.orderDate) : new Date();
  const formatDate = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  };
  
  commands.push(textToBytes(`Diterima: ${formatDate(orderDate)}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.CRLF);
  
  // Items
  commands.push(textToBytes(createLine('-', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('DETAIL TRANSAKSI:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  const serviceItems = receiptData.items?.filter((item: any) => item.item_type !== 'product') || [];
  const productItems = receiptData.items?.filter((item: any) => item.item_type === 'product') || [];
  
  if (serviceItems.length > 0) {
    commands.push(ESC_POS.BOLD_ON);
    commands.push(textToBytes('LAYANAN:'));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.BOLD_OFF);
    
    serviceItems.forEach((item: any) => {
      const qtyText = item.service_type === 'kilo' && item.weight_kg ? 
        `${item.weight_kg}kg` : `${item.quantity || 1}x`;
      const itemLine = `${qtyText} ${item.service_name || item.name || ''}`;
      commands.push(textToBytes(formatTextForThermal(itemLine, paperWidth - 10)));
      commands.push(ESC_POS.CRLF);
      
      const price = item.line_total || item.service_price || item.price || 0;
      const priceText = `Rp ${price.toLocaleString('id-ID')}`;
      const spacesToAdd = Math.max(0, paperWidth - priceText.length);
      const priceLine = ' '.repeat(spacesToAdd) + priceText;
      commands.push(textToBytes(priceLine));
      commands.push(ESC_POS.CRLF);
      commands.push(ESC_POS.LF);
    });
  }
  
  if (productItems.length > 0) {
    commands.push(ESC_POS.BOLD_ON);
    commands.push(textToBytes('PRODUK & BARANG:'));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.BOLD_OFF);
    
    productItems.forEach((item: any) => {
      const qtyText = `${item.quantity || 1}x`;
      const itemLine = `${qtyText} ${item.service_name || item.name || ''}`;
      commands.push(textToBytes(formatTextForThermal(itemLine, paperWidth - 10)));
      commands.push(ESC_POS.CRLF);
      
      const price = item.line_total || item.service_price || item.price || 0;
      const priceText = `Rp ${price.toLocaleString('id-ID')}`;
      const spacesToAdd = Math.max(0, paperWidth - priceText.length);
      const priceLine = ' '.repeat(spacesToAdd) + priceText;
      commands.push(textToBytes(priceLine));
      commands.push(ESC_POS.CRLF);
      commands.push(ESC_POS.LF);
    });
  }
  
  // Totals
  commands.push(textToBytes(createLine('-', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  if (receiptData.subtotal && receiptData.subtotal > 0) {
    const subtotalText = `Subtotal: Rp ${receiptData.subtotal.toLocaleString('id-ID')}`;
    const spacesToAdd = Math.max(0, paperWidth - subtotalText.length);
    commands.push(textToBytes(' '.repeat(spacesToAdd) + subtotalText));
    commands.push(ESC_POS.CRLF);
  }

  if (receiptData.discountAmount && receiptData.discountAmount > 0) {
    const discountText = `Diskon: -Rp ${receiptData.discountAmount.toLocaleString('id-ID')}`;
    const spacesToAdd = Math.max(0, paperWidth - discountText.length);
    commands.push(textToBytes(' '.repeat(spacesToAdd) + discountText));
    commands.push(ESC_POS.CRLF);
  }

  if (receiptData.taxAmount && receiptData.taxAmount > 0) {
    const taxText = `Pajak: Rp ${receiptData.taxAmount.toLocaleString('id-ID')}`;
    const spacesToAdd = Math.max(0, paperWidth - taxText.length);
    commands.push(textToBytes(' '.repeat(spacesToAdd) + taxText));
    commands.push(ESC_POS.CRLF);
  }

  // Total
  commands.push(ESC_POS.BOLD_ON);
  commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
  const totalText = `TOTAL: Rp ${(receiptData.totalAmount || 0).toLocaleString('id-ID')}`;
  commands.push(textToBytes(centerText(totalText, paperWidth / 2)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(ESC_POS.SIZE_NORMAL);
  
  // Payment info
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  const paymentStatusText = receiptData.paymentStatus === 'completed' ? 'LUNAS' : 'BELUM LUNAS';
  commands.push(textToBytes(`Pembayaran: ${paymentStatusText}`));
  commands.push(ESC_POS.CRLF);
  
  // Footer
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.ALIGN_CENTER);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(centerText('TERIMA KASIH!', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(textToBytes(centerText('Semoga puas dengan layanan kami', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText('Simpan nota ini sebagai bukti', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Feed and cut
  if (options.feedLines && options.feedLines > 0) {
    for (let i = 0; i < options.feedLines; i++) {
      commands.push(ESC_POS.LF);
    }
  } else {
    commands.push(ESC_POS.FEED_LINE);
  }
  
  if (options.cutPaper !== false) {
    commands.push(ESC_POS.CUT);
  }
  
  return combineBytes(...commands);
};

/**
 * Unified print function that works on both browser and Android
 */
export const printReceipt = async (
  orderId: string,
  connection?: ThermalPrinterConnection | NativePrinterConnection
): Promise<void> => {
  const receiptData = await fetchReceiptDataForThermal(orderId);
  
  if (isAndroid() && connection && 'deviceAddress' in connection) {
    // Use native Android printing
    const printData = formatReceiptForNativePrinting(receiptData, {
      paperWidth: 32,
      cutPaper: true,
      feedLines: 3,
    });
    
    await ThermalPrinter.printRaw({ data: printData });
  } else if (connection && 'device' in connection) {
    // Use Web Bluetooth printing
    await printWebBluetooth(receiptData, connection as ThermalPrinterConnection);
  } else {
    throw new Error('No valid printer connection provided');
  }
};

/**
 * List available printers (Android only)
 */
export const listPairedPrinters = async (): Promise<Array<{ name: string; address: string }>> => {
  if (!isAndroid()) {
    throw new Error('listPairedPrinters is only available on Android');
  }
  
  const result = await ThermalPrinter.listPairedDevices();
  return result.devices;
};

/**
 * Connect to thermal printer (Android native)
 */
export const connectNativePrinter = async (address: string): Promise<NativePrinterConnection> => {
  if (!isAndroid()) {
    throw new Error('Native printer connection is only available on Android');
  }
  
  const result = await ThermalPrinter.connect({ address });
  return {
    deviceName: result.deviceName,
    deviceAddress: result.deviceAddress,
  };
};

/**
 * Disconnect from thermal printer (Android native)
 */
export const disconnectNativePrinter = async (): Promise<void> => {
  if (!isAndroid()) {
    throw new Error('Native printer disconnect is only available on Android');
  }
  
  await ThermalPrinter.disconnect();
};

/**
 * Check if native printer is connected (Android only)
 */
export const isNativePrinterConnected = async (): Promise<boolean> => {
  if (!isAndroid()) {
    return false;
  }
  
  const result = await ThermalPrinter.isConnected();
  return result.connected;
};

/**
 * Request Bluetooth permissions (Android only)
 */
export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (!isAndroid()) {
    return true; // Browser handles permissions through Web Bluetooth API
  }
  
  const result = await ThermalPrinter.requestPermissions();
  return result.granted;
};

// Re-export browser-based functions for backward compatibility
export {
  connectWebBluetooth as connectThermalPrinter,
  disconnectWebBluetooth as disconnectThermalPrinter,
  fetchReceiptDataForThermal,
  type ThermalPrinterConnection,
};
