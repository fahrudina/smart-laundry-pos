import { supabase } from '@/integrations/supabase/client';
import { BleClient, BleService } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import type { OfflineOrderPayload } from '@/lib/offlineDb';

// Constants
const IFRAME_RENDER_WAIT_MS = 1000;
const PRINT_WINDOW_CHECK_INTERVAL_MS = 100;

// Thermal Printer Constants
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Generic thermal printer
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom thermal printer service
  '0000fee0-0000-1000-8000-00805f9b34fb', // Common in MP-series printers
  '0000fee1-0000-1000-8000-00805f9b34fb', // Alternative MP-series service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip RN4020 service (common in thermal printers)
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
];

const THERMAL_PRINTER_CHARACTERISTICS = [
  '00002a00-0000-1000-8000-00805f9b34fb', // Generic write characteristic
  '0000ff01-0000-1000-8000-00805f9b34fb', // Custom write characteristic
  '000018f1-0000-1000-8000-00805f9b34fb', // Thermal printer data characteristic
  '0000fee1-0000-1000-8000-00805f9b34fb', // MP-series write characteristic
  '0000fee2-0000-1000-8000-00805f9b34fb', // MP-series data characteristic
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip write characteristic
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX characteristic
  '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART RX characteristic
];

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

const ESC_POS = {
  // Initialize printer
  INIT: new Uint8Array([ESC, 0x40]), // ESC @
  
  // Text formatting
  BOLD_ON: new Uint8Array([ESC, 0x45, 1]), // ESC E 1
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0]), // ESC E 0
  
  // Text alignment
  ALIGN_LEFT: new Uint8Array([ESC, 'a'.charCodeAt(0), 0]),
  ALIGN_CENTER: new Uint8Array([ESC, 'a'.charCodeAt(0), 1]),
  ALIGN_RIGHT: new Uint8Array([ESC, 'a'.charCodeAt(0), 2]),
  
  // Text size
  SIZE_NORMAL: new Uint8Array([GS, '!'.charCodeAt(0), 0]),
  SIZE_DOUBLE_WIDTH: new Uint8Array([GS, '!'.charCodeAt(0), 0x10]),
  SIZE_DOUBLE_HEIGHT: new Uint8Array([GS, '!'.charCodeAt(0), 0x01]),
  SIZE_DOUBLE: new Uint8Array([GS, '!'.charCodeAt(0), 0x11]),
  
  // Line feeds
  LF: new Uint8Array([0x0a]),
  CR: new Uint8Array([0x0d]),
  CRLF: new Uint8Array([0x0d, 0x0a]),
  
  // Cut paper
  CUT: new Uint8Array([GS, 'V'.charCodeAt(0), 1]),
  CUT_PARTIAL: new Uint8Array([GS, 'V'.charCodeAt(0), 0]),
  
  // Feed lines
  FEED_LINE: new Uint8Array([ESC, 'd'.charCodeAt(0), 3]),
};

interface PrintOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export interface ThermalPrinterConnection {
  deviceId: string;
  deviceName?: string;
  serviceUuid: string;
  characteristicUuid: string;
  useWithoutResponse: boolean;
}

interface ThermalPrintOptions {
  paperWidth?: number; // in characters (default: 32)
  fontSize?: 'normal' | 'large' | 'extra-large';
  alignment?: 'left' | 'center' | 'right';
  cutPaper?: boolean;
  feedLines?: number;
}

/**
 * Utility functions for receipt printing and PDF generation
 */

/**
 * Convert text to ESC/POS compatible byte array
 */
const textToBytes = (text: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

/**
 * Combine multiple Uint8Arrays into one
 */
const combineBytes = (...arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};

/**
 * Wrap a Uint8Array in a DataView, as required by @capacitor-community/bluetooth-le's write calls
 */
const uint8ArrayToDataView = (bytes: Uint8Array): DataView => {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
};

/**
 * Format text for thermal printer with specific width
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
        // Word is longer than width, split it
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
 * Create a line separator for thermal printer
 */
const createLine = (char: string = '-', width: number = 32): string => {
  return char.repeat(width);
};

/**
 * Sanitizes a string for use in filenames by replacing invalid characters
 */
export const sanitizeFilename = (name: string): string => {
  // Replace any character that is not a-z, A-Z, 0-9, hyphen, or underscore with a hyphen
  return name.replace(/[^a-zA-Z0-9-_]/g, '-');
};

/**
 * Opens a receipt page in a new window for printing
 */
export const openReceiptForPrint = (orderId: string): void => {
  const receiptUrl = `/receipt/${orderId}`;
  const printWindow = window.open(receiptUrl, '_blank', 'width=800,height=1000,scrollbars=yes');
  
  if (printWindow) {
    // Wait for the page and all resources to load before triggering print
    const interval = setInterval(() => {
      try {
        if (printWindow.document.readyState === 'complete') {
          clearInterval(interval);
          printWindow.print();
        }
      } catch (e) {
        // Ignore cross-origin errors until the page is ready
      }
    }, PRINT_WINDOW_CHECK_INTERVAL_MS);

    // Fallback timeout to prevent infinite checking
    setTimeout(() => {
      clearInterval(interval);
      if (printWindow && !printWindow.closed) {
        printWindow.print();
      }
    }, 5000);
  }
};

/**
 * Opens a receipt page in a new tab for viewing
 */
export const openReceiptForView = (orderId: string): void => {
  const receiptUrl = `/receipt/${orderId}`;
  window.open(receiptUrl, '_blank');
};

/**
 * Generates PDF from a DOM element (usually receipt component)
 */
export const generateReceiptPDF = async (
  elementId: string, 
  options: PrintOptions = {}
): Promise<void> => {
  const {
    filename = 'receipt.pdf',
    quality = 1,
    scale = 2
  } = options;

  try {
    // Dynamic imports to reduce bundle size
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    // Generate canvas from the element
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions to fit the content
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generates PDF from receipt URL (by opening it in hidden iframe)
 */
export const generateReceiptPDFFromUrl = async (
  orderId: string,
  options: PrintOptions = {}
): Promise<void> => {
  const {
    filename = `receipt-${orderId}.pdf`,
    quality = 1,
    scale = 2
  } = options;

  return new Promise((resolve, reject) => {
    // Create hidden iframe to load the receipt
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '800px';
    iframe.style.height = '1000px';
    iframe.src = `/receipt/${orderId}`;
    
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        // Dynamic imports to reduce bundle size
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error('Failed to access iframe content');
        }

        // Wait a bit for content to render
        await new Promise(resolve => setTimeout(resolve, IFRAME_RENDER_WAIT_MS));

        const receiptElement = iframeDoc.body;
        
        // Generate canvas from the iframe content
        const canvas = await html2canvas(receiptElement, {
          scale,
          useCORS: true,
          allowTaint: false,
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Calculate dimensions
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Add content to PDF
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save and clean up
        pdf.save(filename);
        document.body.removeChild(iframe);
        resolve();
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error('Failed to load receipt page'));
    };
  });
};

/**
 * Check if Bluetooth Low Energy is supported: native (Android/iOS via Capacitor) or Web Bluetooth in-browser
 */
export const isBluetoothSupported = (): boolean => {
  return Capacitor.isNativePlatform() || 'bluetooth' in navigator;
};

/**
 * Find a writable characteristic among a device's discovered services, preferring the
 * known thermal-printer service UUIDs but falling back to any writable characteristic
 * if none of those are present.
 *
 * Note: the "fall back to any service" path only does anything useful on native platforms.
 * On web, requestDevice's optionalServices (set to THERMAL_PRINTER_SERVICES) is a hard
 * allowlist enforced by the Web Bluetooth API itself - getServices() can never return a
 * service outside that list there, so `services` is already equivalent to `knownServices`.
 */
const findWritableCharacteristic = async (
  deviceId: string,
  services: BleService[]
): Promise<{ serviceUuid: string; characteristicUuid: string; useWithoutResponse: boolean } | null> => {
  const knownServices = services.filter(service =>
    THERMAL_PRINTER_SERVICES.includes(service.uuid.toLowerCase())
  );
  const candidateServices = knownServices.length > 0 ? knownServices : services;

  for (const service of candidateServices) {
    for (const characteristic of service.characteristics) {
      const useWithoutResponse = !characteristic.properties.write && characteristic.properties.writeWithoutResponse;
      if (!characteristic.properties.write && !useWithoutResponse) {
        continue;
      }

      try {
        const testData = uint8ArrayToDataView(new Uint8Array([ESC, 0x40])); // ESC @ (initialize printer)
        if (useWithoutResponse) {
          await BleClient.writeWithoutResponse(deviceId, service.uuid, characteristic.uuid, testData);
        } else {
          await BleClient.write(deviceId, service.uuid, characteristic.uuid, testData);
        }
        return { serviceUuid: service.uuid, characteristicUuid: characteristic.uuid, useWithoutResponse };
      } catch (error) {
        console.warn(`Characteristic ${characteristic.uuid} (service ${service.uuid}) rejected the test write:`, error);
      }
    }
  }

  return null;
};

/**
 * Check if Thermer app integration is available
 */
export const isThermerAppAvailable = (): boolean => {
  // Check if we're in an Android WebView that might have Thermer integration
  return /Android/i.test(navigator.userAgent) && 'Android' in window;
};

/**
 * Connect to thermal printer via Bluetooth Low Energy.
 * Works both inside the native Android/iOS app (via Capacitor's native BLE stack) and
 * in a regular browser (the plugin falls back to the Web Bluetooth API on web).
 *
 * @param onDisconnect Optional callback fired with the device's ID when it disconnects unexpectedly
 */
export const connectThermalPrinter = async (
  onDisconnect?: (deviceId: string) => void
): Promise<ThermalPrinterConnection> => {
  if (!isBluetoothSupported()) {
    throw new Error('Bluetooth is not supported on this device');
  }

  try {
    // androidNeverForLocation defaults to false - this repo's android/ project is
    // regenerated fresh by CI (npx cap add android) with no manifest patch step, so we
    // can't assert neverForLocation without the matching AndroidManifest.xml declaration.
    // Asserting it without that manifest entry makes Android silently return zero BLE
    // scan results instead of erroring.
    await BleClient.initialize();

    // Android 13+ forbids silently turning Bluetooth on for the user - requestEnable() is
    // the closest available thing, showing the native "Turn on Bluetooth?" system prompt
    // instead of making the user dig into Settings manually before every connect attempt.
    if (Capacitor.getPlatform() === 'android' && !(await BleClient.isEnabled())) {
      await BleClient.requestEnable();
    }

    // Let the user pick from all nearby BLE devices - printer name/branding varies too much
    // across vendors to reliably pre-filter, so we discover the write characteristic afterward instead.
    const device = await BleClient.requestDevice({
      optionalServices: THERMAL_PRINTER_SERVICES,
    });

    // Don't forward onDisconnect until setup actually succeeds below - otherwise the
    // cleanup disconnect() in the !writable branch would fire it, showing a spurious
    // "printer disconnected" toast right before the real "connection failed" one.
    let setupComplete = false;
    await BleClient.connect(device.deviceId, (disconnectedDeviceId) => {
      if (setupComplete) {
        onDisconnect?.(disconnectedDeviceId);
      }
    });

    let services = await BleClient.getServices(device.deviceId);
    const hasDiscoveredCharacteristics = services.some(service => service.characteristics.length > 0);
    // Some Android devices resolve `connect` before GATT service discovery has actually
    // finished, leaving getServices() empty - force a fresh discovery and retry once.
    if (!hasDiscoveredCharacteristics && Capacitor.isNativePlatform()) {
      await BleClient.discoverServices(device.deviceId);
      services = await BleClient.getServices(device.deviceId);
    }

    const writable = await findWritableCharacteristic(device.deviceId, services);

    if (!writable) {
      await BleClient.disconnect(device.deviceId);
      throw new Error(`No compatible thermal printer service/characteristic found for ${device.name || 'this device'}. Please ensure the printer is in pairing mode and try again.`);
    }

    setupComplete = true;
    return {
      deviceId: device.deviceId,
      deviceName: device.name,
      serviceUuid: writable.serviceUuid,
      characteristicUuid: writable.characteristicUuid,
      useWithoutResponse: writable.useWithoutResponse,
    };
  } catch (error) {
    console.error('Failed to connect to thermal printer:', error);
    throw error;
  }
};

/**
 * Disconnect from thermal printer
 */
export const disconnectThermalPrinter = async (connection: ThermalPrinterConnection): Promise<void> => {
  try {
    await BleClient.disconnect(connection.deviceId);
  } catch (error) {
    console.error('Error disconnecting from thermal printer:', error);
  }
};

/**
 * Format receipt content for thermal printing
 */
const formatReceiptForThermal = (receiptData: any, options: ThermalPrintOptions = {}): Uint8Array => {
  const { paperWidth = 32, fontSize = 'normal', alignment = 'left' } = options;
  const commands: Uint8Array[] = [];
  
  // Initialize printer
  commands.push(ESC_POS.INIT);
  
  // Store Header
  commands.push(ESC_POS.ALIGN_CENTER);
  commands.push(ESC_POS.SIZE_DOUBLE);
  commands.push(ESC_POS.BOLD_ON);
  // SIZE_DOUBLE doubles character width, so only half as many fit per physical line -
  // centerText's padding must be computed against paperWidth / 2, or it overflows the
  // line and wraps instead of centering (same reasoning as the service name below).
  commands.push(textToBytes(centerText(receiptData.storeName || 'SMART LAUNDRY POS', paperWidth / 2)));
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
  
  // QR Code notice (if enabled)
  // if (receiptData.enableQr) {
  //   commands.push(ESC_POS.CRLF);
  //   commands.push(textToBytes(centerText('[QR Code tersedia di nota digital]', paperWidth)));
  //   commands.push(ESC_POS.CRLF);
  //   commands.push(textToBytes(centerText('Scan untuk pembayaran digital', paperWidth)));
  //   commands.push(ESC_POS.CRLF);
  // }
  
  // Separator
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Customer Information - printed above Order ID so the customer is the first
  // thing staff see/scan for when handing over or looking up an order.
  commands.push(ESC_POS.ALIGN_LEFT);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('CUSTOMER INFO:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);

  // Customer name - make it more prominent
  commands.push(ESC_POS.BOLD_ON);
  commands.push(ESC_POS.SIZE_DOUBLE);
  commands.push(textToBytes(`${receiptData.customerName || 'CUSTOMER'}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(ESC_POS.SIZE_NORMAL);

  if (receiptData.customerPhone) {
    // Mask phone number for privacy
    const maskedPhone = receiptData.customerPhone.replace(/(\d{2,3})\d{4}(\d{2,3})/, '$1****$2');
    commands.push(textToBytes(`No. HP: ${maskedPhone}`));
    commands.push(ESC_POS.CRLF);
  }

  // Order details
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(`ORDER ID: ${receiptData.orderId || ''}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);

  // Add extra line break and ensure we're back to normal formatting
  commands.push(ESC_POS.ALIGN_LEFT);
  commands.push(ESC_POS.SIZE_NORMAL);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(ESC_POS.CRLF);
  
  // Service type
  if (receiptData.items && receiptData.items.length > 0) {
    const firstItem = receiptData.items[0];
    commands.push(ESC_POS.ALIGN_CENTER);
    commands.push(ESC_POS.BOLD_ON);
    commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
    commands.push(textToBytes(centerText(firstItem.service_name || 'LAYANAN KILOAN', paperWidth / 2)));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.BOLD_OFF);
    commands.push(ESC_POS.SIZE_NORMAL);
    commands.push(textToBytes(centerText(`(${(firstItem.service_name || 'KILOAN REGULER').toUpperCase()})`, paperWidth)));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.ALIGN_LEFT);
  }
  
  commands.push(ESC_POS.CRLF);
  
  // Date and Time
  const orderDate = receiptData.orderDate ? new Date(receiptData.orderDate) : new Date();
  const formatDate = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    // Ensure we have a valid date
    if (isNaN(date.getTime())) {
      date = new Date(); // Fallback to current date if invalid
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
  
  // Status info
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('STATUS LAYANAN:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  const statusMap: { [key: string]: string } = {
    'completed': 'SUDAH DIAMBIL',
    'ready_for_pickup': 'SIAP DIAMBIL',
    'in_progress': 'SEDANG DIKERJAKAN',
    'in_queue': 'DALAM ANTRIAN'
  };
  
  const statusText = statusMap[receiptData.executionStatus] || 'DALAM ANTRIAN';
  commands.push(textToBytes(`Status: ${statusText}`));
  commands.push(ESC_POS.CRLF);
  
  if (receiptData.estimatedCompletion) {
    const completionDate = new Date(receiptData.estimatedCompletion);
    commands.push(textToBytes(`Siap Diambil: ${formatDate(completionDate)}`));
    commands.push(ESC_POS.CRLF);
  }
  
  // Separator
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('-', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Items header
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('DETAIL TRANSAKSI:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  // Separate services and products
  const serviceItems = receiptData.items?.filter((item: any) => item.item_type !== 'product') || [];
  const productItems = receiptData.items?.filter((item: any) => item.item_type === 'product') || [];
  
  // Service Items
  if (serviceItems.length > 0) {
    commands.push(ESC_POS.BOLD_ON);
    commands.push(textToBytes('LAYANAN:'));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.BOLD_OFF);
    
    serviceItems.forEach((item: any) => {
      // Service name and quantity
      const qtyText = item.service_type === 'kilo' && item.weight_kg ? 
        `${item.weight_kg}kg` : `${item.quantity || 1}x`;
      const itemLine = `${qtyText} ${item.service_name || item.name || ''}`;
      commands.push(textToBytes(formatTextForThermal(itemLine, paperWidth - 10)));
      commands.push(ESC_POS.CRLF);
      
      // Price aligned to the right
      const price = item.line_total || item.service_price || item.price || 0;
      const priceText = `Rp ${price.toLocaleString('id-ID')}`;
      const spacesToAdd = Math.max(0, paperWidth - priceText.length);
      const priceLine = ' '.repeat(spacesToAdd) + priceText;
      commands.push(textToBytes(priceLine));
      commands.push(ESC_POS.CRLF);
      
      // Add price per kg info if applicable
      if (item.service_type === 'kilo' && item.weight_kg && item.weight_kg > 0) {
        const pricePerKg = Math.round(price / item.weight_kg);
        commands.push(textToBytes(`  @ Rp ${pricePerKg.toLocaleString('id-ID')}/kg`));
        commands.push(ESC_POS.CRLF);
      }
      
      // Add extra line for readability
      commands.push(ESC_POS.LF);
    });
  }
  
  // Product Items
  if (productItems.length > 0) {
    commands.push(ESC_POS.BOLD_ON);
    commands.push(textToBytes('PRODUK & BARANG:'));
    commands.push(ESC_POS.CRLF);
    commands.push(ESC_POS.BOLD_OFF);
    
    productItems.forEach((item: any) => {
      // Product name and quantity
      const qtyText = `${item.quantity || 1}x`;
      const itemLine = `${qtyText} ${item.service_name || item.name || ''}`;
      commands.push(textToBytes(formatTextForThermal(itemLine, paperWidth - 10)));
      commands.push(ESC_POS.CRLF);
      
      // Price aligned to the right
      const price = item.line_total || item.service_price || item.price || 0;
      const priceText = `Rp ${price.toLocaleString('id-ID')}`;
      const spacesToAdd = Math.max(0, paperWidth - priceText.length);
      const priceLine = ' '.repeat(spacesToAdd) + priceText;
      commands.push(textToBytes(priceLine));
      commands.push(ESC_POS.CRLF);
      
      // Add extra line for readability
      commands.push(ESC_POS.LF);
    });
  }
  
  // Separator
  commands.push(textToBytes(createLine('-', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Totals
  if (receiptData.subtotal && receiptData.subtotal > 0) {
    const subtotalText = `Subtotal: Rp ${receiptData.subtotal.toLocaleString('id-ID')}`;
    const spacesToAdd = Math.max(0, paperWidth - subtotalText.length);
    commands.push(textToBytes(' '.repeat(spacesToAdd) + subtotalText));
    commands.push(ESC_POS.CRLF);
  }

  // Discount (if any)
  if (receiptData.discountAmount && receiptData.discountAmount > 0) {
    const discountText = `Diskon: -Rp ${receiptData.discountAmount.toLocaleString('id-ID')}`;
    const spacesToAdd = Math.max(0, paperWidth - discountText.length);
    commands.push(textToBytes(' '.repeat(spacesToAdd) + discountText));
    commands.push(ESC_POS.CRLF);

    // Points redeemed info (if discount from points)
    if (receiptData.pointsRedeemed && receiptData.pointsRedeemed > 0) {
      const pointsText = `  (${receiptData.pointsRedeemed} poin ditukar)`;
      commands.push(textToBytes(pointsText));
      commands.push(ESC_POS.CRLF);
    }
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
  
  // Payment info section
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('PEMBAYARAN:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  // Payment status
  const paymentStatusText = receiptData.paymentStatus === 'completed' ? 'LUNAS' : 
                            receiptData.paymentStatus === 'down_payment' ? 'DP (BELUM LUNAS)' : 'BELUM LUNAS';
  commands.push(textToBytes(`Status: ${paymentStatusText}`));
  commands.push(ESC_POS.CRLF);
  
  // Payment method
  if (receiptData.paymentMethod) {
    const methodText = receiptData.paymentMethod.toUpperCase() + 
                      (receiptData.paymentStatus === 'down_payment' ? ' (DP)' : '');
    commands.push(textToBytes(`Metode: ${methodText}`));
    commands.push(ESC_POS.CRLF);
    
    // Down payment details
    if (receiptData.paymentStatus === 'down_payment' || 
        (receiptData.paymentAmount && receiptData.paymentAmount < receiptData.totalAmount)) {
      commands.push(ESC_POS.CRLF);
      commands.push(ESC_POS.BOLD_ON);
      commands.push(textToBytes(`Bayar DP: Rp ${(receiptData.paymentAmount || 0).toLocaleString('id-ID')}`));
      commands.push(ESC_POS.CRLF);
      commands.push(ESC_POS.BOLD_OFF);
      
      const remaining = receiptData.totalAmount - (receiptData.paymentAmount || 0);
      commands.push(textToBytes(`Sisa Bayar: Rp ${remaining.toLocaleString('id-ID')}`));
      commands.push(ESC_POS.CRLF);
    }
    
    // Cash payment details (for completed payments)
    if (receiptData.paymentMethod === 'cash' && receiptData.cashReceived && receiptData.paymentStatus === 'completed') {
      commands.push(ESC_POS.CRLF);
      commands.push(textToBytes(`Uang Diterima: Rp ${receiptData.cashReceived.toLocaleString('id-ID')}`));
      commands.push(ESC_POS.CRLF);
      
      const change = receiptData.cashReceived - receiptData.totalAmount;
      if (change > 0) {
        commands.push(ESC_POS.BOLD_ON);
        commands.push(textToBytes(`Kembalian: Rp ${change.toLocaleString('id-ID')}`));
        commands.push(ESC_POS.CRLF);
        commands.push(ESC_POS.BOLD_OFF);
      }
    }
  }
  
  // Footer section
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  commands.push(ESC_POS.ALIGN_CENTER);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(centerText('TERIMA KASIH!', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  commands.push(textToBytes(centerText('Semoga puas dengan layanan kami', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Important notes
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText('--- PENTING ---', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText('Simpan nota ini sebagai bukti', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText('pengambilan laundry', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Digital receipt info
  // commands.push(ESC_POS.CRLF);
  // commands.push(textToBytes(centerText('Nota digital tersedia di:', paperWidth)));
  // commands.push(ESC_POS.CRLF);
  // commands.push(textToBytes(centerText(`/receipt/${receiptData.orderId}`, paperWidth)));
  // commands.push(ESC_POS.CRLF);
  
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
 * Print to thermal printer with enhanced support
 */
export const printToThermalPrinter = async (
  receiptData: any,
  connection?: ThermalPrinterConnection,
  options: ThermalPrintOptions = {}
): Promise<void> => {
  if (!connection) {
    throw new Error('No thermal printer connection provided');
  }

  try {
    const printData = formatReceiptForThermal(receiptData, {
      paperWidth: 32,
      cutPaper: true,
      feedLines: 3,
      ...options
    });

    // Native BLE writes are capped at the negotiated MTU minus 3 bytes of ATT overhead -
    // a fixed 128-byte chunk can exceed that (default MTU is often only 23 bytes) and every
    // write then fails. getMtu isn't available on web, where the plugin's Web Bluetooth
    // backing handles this differently, so keep the previous fixed size there.
    let CHUNK_SIZE = 128;
    if (Capacitor.isNativePlatform()) {
      try {
        const mtu = await BleClient.getMtu(connection.deviceId);
        CHUNK_SIZE = Math.max(20, mtu - 3);
      } catch (error) {
        console.warn('Failed to read negotiated MTU, falling back to a conservative chunk size:', error);
        CHUNK_SIZE = 20;
      }
    }
    const chunks: Uint8Array[] = [];

    for (let i = 0; i < printData.byteLength; i += CHUNK_SIZE) {
      chunks.push(printData.slice(i, i + CHUNK_SIZE));
    }

    // Send chunks with delays to ensure the printer can process each one
    for (let i = 0; i < chunks.length; i++) {
      const chunk = uint8ArrayToDataView(chunks[i]);

      try {
        if (connection.useWithoutResponse) {
          await BleClient.writeWithoutResponse(connection.deviceId, connection.serviceUuid, connection.characteristicUuid, chunk);
        } else {
          await BleClient.write(connection.deviceId, connection.serviceUuid, connection.characteristicUuid, chunk);
        }

        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (chunkError) {
        console.error(`Error sending chunk ${i + 1}:`, chunkError);
        throw new Error('Printer connection error. Please disconnect and reconnect to the thermal printer, then try again.');
      }
    }

    // Add a final delay to ensure all data is processed by the printer
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error('Error printing to thermal printer:', error);
    throw error instanceof Error ? error : new Error('Failed to print to thermal printer');
  }
};

export interface LocalReceiptStoreInfo {
  name: string;
  address?: string;
  phone?: string;
  enable_qr?: boolean;
}

export interface LocalReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  customerName: string;
  customerPhone: string;
  orderId: string;
  orderDate: string;
  items: Array<OfflineOrderPayload['items'][number] & { line_total: number }>;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  pointsRedeemed: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentAmount: number | null;
  executionStatus: string;
  estimatedCompletion: string | null;
  cashReceived: number | null;
  enableQr: boolean;
}

/**
 * Builds the same receipt shape fetchReceiptDataForThermal returns, but
 * directly from an in-memory order that hasn't synced to Supabase yet
 * (offline order creation - get_receipt_data is an RPC that requires a
 * server-confirmed order, so it isn't reachable for these).
 */
export const buildReceiptDataFromLocalOrder = (
  localOrderId: string,
  payload: OfflineOrderPayload,
  storeInfo: LocalReceiptStoreInfo
): LocalReceiptData => {
  return {
    storeName: storeInfo.name || 'SMART LAUNDRY POS',
    storeAddress: storeInfo.address || '',
    storePhone: storeInfo.phone || '',
    customerName: payload.customer_name || '',
    customerPhone: payload.customer_phone || '',
    orderId: localOrderId,
    orderDate: payload.order_date || new Date().toISOString(),
    items: payload.items.map((item) => ({
      ...item,
      line_total: item.service_price * item.quantity,
    })),
    totalAmount: payload.total_amount || 0,
    subtotal: payload.subtotal || 0,
    taxAmount: payload.tax_amount || 0,
    discountAmount: payload.discount_amount || 0,
    pointsRedeemed: 0,
    paymentMethod: payload.payment_method || 'cash',
    paymentStatus: payload.payment_status || 'pending',
    paymentAmount: payload.payment_amount ?? null,
    executionStatus: payload.execution_status || 'in_queue',
    estimatedCompletion: payload.estimated_completion || null,
    cashReceived: payload.cash_received ?? null,
    enableQr: storeInfo.enable_qr || false,
  };
};

/**
 * Fetch receipt data for thermal printing
 */
export const fetchReceiptDataForThermal = async (orderId: string): Promise<any> => {
  try {
    
    // Fetch order data using the same RPC function as the receipt page
    const { data: receiptData, error } = await supabase.rpc('get_receipt_data', {
      order_id_param: orderId
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      throw new Error(`Failed to fetch receipt data: ${error.message || error.details || 'Unknown error'}`);
    }

    if (!receiptData) {
      console.error('❌ No receipt data returned');
      throw new Error('Receipt data not found');
    }


    // Transform the data for thermal printing - handle nested structure from RPC function
    const orderData = receiptData.order || {};
    const storeData = receiptData.store || {};
    const orderItems = receiptData.order_items || [];


    const transformedData = {
      storeName: storeData.name || 'SMART LAUNDRY POS',
      storeAddress: storeData.address || '',
      storePhone: storeData.phone || '',
      customerName: orderData.customer_name || '',
      customerPhone: orderData.customer_phone || '',
      orderId: orderData.id || orderId,
      orderDate: orderData.order_date || orderData.created_at || new Date().toISOString(),
      items: orderItems,
      totalAmount: orderData.total_amount || 0,
      subtotal: orderData.subtotal || 0,
      taxAmount: orderData.tax_amount || 0,
      discountAmount: orderData.discount_amount || 0,
      pointsRedeemed: orderData.points_redeemed || 0,
      paymentMethod: orderData.payment_method || 'cash',
      paymentStatus: orderData.payment_status || 'pending',
      paymentAmount: orderData.payment_amount || null,
      executionStatus: orderData.execution_status || 'in_queue',
      estimatedCompletion: orderData.estimated_completion || null,
      cashReceived: orderData.cash_received || null,
      enableQr: storeData.enable_qr || false,
    };

    return transformedData;
  } catch (error) {
    console.error('Error fetching receipt data for thermal printing:', error);
    throw error;
  }
};

/**
 * Print receipt using Thermer app integration
 */
export const printToThermerApp = async (receiptData: any): Promise<void> => {
  if (!isThermerAppAvailable()) {
    throw new Error('Thermer app integration is not available');
  }

  try {
    // Format receipt data for Thermer app
    const thermerData = {
      type: 'receipt',
      data: {
        header: receiptData.storeName || 'LAUNDRY RECEIPT',
        items: receiptData.items || [],
        total: receiptData.totalAmount || 0,
        customer: receiptData.customerName || '',
        orderId: receiptData.orderId || '',
        date: receiptData.orderDate || new Date().toISOString(),
      }
    };

    // Use Android WebView interface to communicate with Thermer app
    if ('Android' in window && 'printReceipt' in (window as any).Android) {
      await (window as any).Android.printReceipt(JSON.stringify(thermerData));
    } else {
      // Fallback: try to open Thermer app with intent
      const intentUrl = `intent://print?data=${encodeURIComponent(JSON.stringify(thermerData))}#Intent;scheme=thermer;package=mate.bluetoothprint;end`;
      window.location.href = intentUrl;
    }
  } catch (error) {
    console.error('Error printing with Thermer app:', error);
    throw new Error(`Failed to print with Thermer app: ${error.message}`);
  }
};