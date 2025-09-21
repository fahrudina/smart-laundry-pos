// Type declarations for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
  
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }
  
  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }
  
  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    acceptAllDevices?: boolean;
    optionalServices?: BluetoothServiceUUID[];
  }
  
  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
  }
  
  type BluetoothServiceUUID = string | number;
}

import { supabase } from '@/integrations/supabase/client';

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

interface ThermalPrinterConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  characteristic: BluetoothRemoteGATTCharacteristic;
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
 * Check if Web Bluetooth is supported
 */
export const isBluetoothSupported = (): boolean => {
  return 'bluetooth' in navigator;
};

/**
 * Check if Thermer app integration is available
 */
export const isThermerAppAvailable = (): boolean => {
  // Check if we're in an Android WebView that might have Thermer integration
  return /Android/i.test(navigator.userAgent) && 'Android' in window;
};

/**
 * Connect to thermal printer via Bluetooth
 */
export const connectThermalPrinter = async (): Promise<ThermalPrinterConnection | null> => {
  if (!isBluetoothSupported()) {
    throw new Error('Bluetooth is not supported in this browser');
  }

  try {
    console.log('Requesting thermal printer device...');
    
    // Request thermal printer device with specific filters for MP-80M and similar printers
    const device = await navigator.bluetooth!.requestDevice({
      filters: [
        // Filter by device name patterns (common thermal printer names)
        { namePrefix: 'RPP' },
        { namePrefix: 'MP-' },
        { namePrefix: 'PRINTER' },
        { namePrefix: 'POS' },
        { namePrefix: 'THERMAL' },
        { name: 'RPP02N' }, // Your specific printer
        // Filter by services
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { services: ['00001101-0000-1000-8000-00805f9b34fb'] },
        { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] },
        { services: ['0000fee0-0000-1000-8000-00805f9b34fb'] },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
        { services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }
      ],
      optionalServices: [...THERMAL_PRINTER_SERVICES, ...THERMAL_PRINTER_CHARACTERISTICS]
    });

    console.log('Device selected:', device.name || device.id);

    if (!device.gatt) {
      throw new Error('Device does not support GATT');
    }

    // Connect to the device
    console.log('Connecting to GATT server...');
    const server = await device.gatt.connect();
    
    console.log('Connected to GATT server, discovering services...');
    
    // Try to find a compatible service from our known list first
    let service: BluetoothRemoteGATTService | null = null;
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    
    for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
      try {
        service = await server.getPrimaryService(serviceUuid);
        console.log(`Found service: ${serviceUuid}`);
        
        // Get all characteristics for this service
        try {
          const characteristics = await (service as any).getCharacteristics();
          console.log(`Service ${serviceUuid} characteristics:`, characteristics.map((c: any) => c.uuid));
        } catch (charListError) {
          console.log('Could not list characteristics for service', serviceUuid);
        }
        
        // Try to find a compatible characteristic
        for (const charUuid of THERMAL_PRINTER_CHARACTERISTICS) {
          try {
            characteristic = await service.getCharacteristic(charUuid);
            console.log(`Found characteristic: ${charUuid}`);
            
            // Test if we can write to this characteristic
            try {
              // Try a small test write to check permissions
              const testData = new Uint8Array([0x1B, 0x40]); // ESC @ (initialize printer)
              await characteristic.writeValue(testData);
              console.log('✅ Characteristic supports writeValue');
              break;
            } catch (writeError) {
              console.log('❌ writeValue failed, trying writeValueWithoutResponse...');
              try {
                // Try writeValueWithoutResponse if available
                if ('writeValueWithoutResponse' in characteristic) {
                  const testData = new Uint8Array([0x1B, 0x40]);
                  await (characteristic as any).writeValueWithoutResponse(testData);
                  console.log('✅ Characteristic supports writeValueWithoutResponse');
                  break;
                } else {
                  console.log('❌ writeValueWithoutResponse not available');
                }
              } catch (writeWithoutResponseError) {
                console.log('❌ Both write methods failed, trying next characteristic...');
                characteristic = null;
              }
            }
          } catch (charError) {
            console.log(`Characteristic ${charUuid} not found, trying next...`);
          }
        }
        
        if (characteristic) break;
      } catch (serviceError) {
        console.log(`Service ${serviceUuid} not found, trying next...`);
      }
    }

    // If no known service worked, log error with helpful information
    if (!service || !characteristic) {
      device.gatt.disconnect();
      throw new Error(`No compatible thermal printer service/characteristic found for ${device.name || 'MP-80M'}. Please ensure the printer is in pairing mode and try again.`);
    }

    console.log('Successfully connected to thermal printer');
    
    return {
      device,
      server,
      service,
      characteristic
    };
  } catch (error) {
    console.error('Failed to connect to thermal printer:', error);
    throw error;
  }
};

/**
 * Disconnect from thermal printer
 */
export const disconnectThermalPrinter = (connection: ThermalPrinterConnection): void => {
  try {
    if (connection.server.connected) {
      connection.server.disconnect();
      console.log('Disconnected from thermal printer');
    }
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
  
  // QR Code notice (if enabled)
  if (receiptData.enableQr) {
    commands.push(ESC_POS.CRLF);
    commands.push(textToBytes(centerText('[QR Code tersedia di nota digital]', paperWidth)));
    commands.push(ESC_POS.CRLF);
    commands.push(textToBytes(centerText('Scan untuk pembayaran digital', paperWidth)));
    commands.push(ESC_POS.CRLF);
  }
  
  // Separator
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(createLine('=', paperWidth)));
  commands.push(ESC_POS.CRLF);
  
  // Order details
  commands.push(ESC_POS.ALIGN_LEFT);
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes(`ORDER ID: ${receiptData.orderId || ''}`));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  // Customer Information
  commands.push(ESC_POS.BOLD_ON);
  commands.push(textToBytes('CUSTOMER INFO:'));
  commands.push(ESC_POS.CRLF);
  commands.push(ESC_POS.BOLD_OFF);
  
  // Customer name - make it more prominent
  commands.push(ESC_POS.BOLD_ON);
  commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
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
  const orderDate = new Date(receiptData.orderDate || new Date());
  const formatDate = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  };
  
  commands.push(textToBytes(`Tanggal: ${formatDate(orderDate)}`));
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
  
  // Items
  if (receiptData.items && receiptData.items.length > 0) {
    receiptData.items.forEach((item: any) => {
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
  const paymentStatusText = receiptData.paymentStatus === 'completed' ? 'LUNAS' : 'BELUM LUNAS';
  commands.push(textToBytes(`Status: ${paymentStatusText}`));
  commands.push(ESC_POS.CRLF);
  
  // Payment method
  if (receiptData.paymentMethod) {
    commands.push(textToBytes(`Metode: ${receiptData.paymentMethod.toUpperCase()}`));
    commands.push(ESC_POS.CRLF);
    
    // Cash payment details
    if (receiptData.paymentMethod === 'cash' && receiptData.cashReceived && receiptData.paymentStatus === 'completed') {
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
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText('Nota digital tersedia di:', paperWidth)));
  commands.push(ESC_POS.CRLF);
  commands.push(textToBytes(centerText(`/receipt/${receiptData.orderId}`, paperWidth)));
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
    // Validate connection state before printing
    if (!connection.server?.connected) {
      throw new Error('Bluetooth connection is not active. Please reconnect to the printer.');
    }

    if (!connection.characteristic) {
      throw new Error('Printer characteristic is not available. Please reconnect to the printer.');
    }

    console.log('Formatting receipt for thermal printing...');
    const printData = formatReceiptForThermal(receiptData, {
      paperWidth: 32,
      cutPaper: true,
      feedLines: 3,
      ...options
    });

    console.log('Sending data to thermal printer in chunks...');
    console.log('Total data size:', printData.byteLength, 'bytes');
    
    // Split data into chunks to respect Bluetooth characteristic 512-byte limit
    const CHUNK_SIZE = 512;
    const chunks = [];
    
    for (let i = 0; i < printData.byteLength; i += CHUNK_SIZE) {
      const chunk = printData.slice(i, i + CHUNK_SIZE);
      chunks.push(chunk);
    }
    
    console.log(`Sending ${chunks.length} chunks to printer...`);
    
    // Send chunks with small delays to prevent overwhelming the printer
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Sending chunk ${i + 1}/${chunks.length} (${chunk.byteLength} bytes)`);
      
      try {
        // Check connection before each chunk
        if (!connection.server?.connected) {
          throw new Error('Connection lost during printing. Please reconnect and try again.');
        }
        
        // Try writeValue first, then writeValueWithoutResponse if it fails
        try {
          await connection.characteristic.writeValue(chunk);
        } catch (writeError) {
          console.log('writeValue failed, trying writeValueWithoutResponse...');
          if ('writeValueWithoutResponse' in connection.characteristic) {
            await (connection.characteristic as any).writeValueWithoutResponse(chunk);
          } else {
            throw writeError;
          }
        }
        
        // Small delay between chunks to prevent overwhelming the printer
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
        }
      } catch (chunkError) {
        console.error(`Error sending chunk ${i + 1}:`, chunkError);
        
        // If it's a GATT error, provide specific guidance
        if (chunkError.message?.includes('GATT') || chunkError.message?.includes('not permitted')) {
          throw new Error('Printer connection error. Please disconnect and reconnect to the thermal printer, then try again.');
        }
        
        throw chunkError;
      }
    }
    
    console.log('Receipt sent to thermal printer successfully');
  } catch (error) {
    console.error('Error printing to thermal printer:', error);
    
    // Provide more specific error messages for common issues
    if (error.message?.includes('GATT') || error.message?.includes('not permitted')) {
      throw new Error('Printer connection error. Please disconnect and reconnect to the thermal printer, then try again.');
    }
    
    throw new Error(`Failed to print to thermal printer: ${error.message}`);
  }
};

/**
 * Fetch receipt data for thermal printing
 */
export const fetchReceiptDataForThermal = async (orderId: string): Promise<any> => {
  try {
    console.log('🧾 Fetching receipt data for thermal printing, order:', orderId);
    
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

    console.log('📄 Receipt data fetched for thermal printing:', receiptData);
    console.log('📄 Receipt data type:', typeof receiptData);
    console.log('📄 Receipt data keys:', Object.keys(receiptData || {}));

    // Transform the data for thermal printing - handle nested structure from RPC function
    const orderData = receiptData.order || {};
    const storeData = receiptData.store || {};
    const orderItems = receiptData.order_items || [];

    console.log('🏪 Store data:', storeData);
    console.log('📋 Order data:', orderData);
    console.log('📦 Order items:', orderItems);

    const transformedData = {
      storeName: storeData.name || 'SMART LAUNDRY POS',
      storeAddress: storeData.address || '',
      storePhone: storeData.phone || '',
      customerName: orderData.customer_name || '',
      customerPhone: orderData.customer_phone || '',
      orderId: orderData.id || orderId,
      orderDate: orderData.order_date ? new Date(orderData.order_date).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
      items: orderItems,
      totalAmount: orderData.total_amount || 0,
      subtotal: orderData.subtotal || 0,
      taxAmount: orderData.tax_amount || 0,
      paymentMethod: orderData.payment_method || 'cash',
      paymentStatus: orderData.payment_status || 'pending',
      executionStatus: orderData.execution_status || 'in_queue',
      estimatedCompletion: orderData.estimated_completion || null,
      cashReceived: orderData.cash_received || null,
      enableQr: storeData.enable_qr || false,
    };

    console.log('🔄 Transformed data:', transformedData);
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