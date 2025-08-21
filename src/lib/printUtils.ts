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

// Constants
const IFRAME_RENDER_WAIT_MS = 1000;
const PRINT_WINDOW_CHECK_INTERVAL_MS = 100;

interface PrintOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Utility functions for receipt printing and PDF generation
 */

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
 * Basic thermal printer support (placeholder for future enhancement)
 */
export const connectThermalPrinter = async (): Promise<BluetoothDevice | null> => {
  if (!isBluetoothSupported()) {
    throw new Error('Bluetooth is not supported in this browser');
  }

  try {
    // Request thermal printer device
    const device = await navigator.bluetooth!.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Generic thermal printer
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    return device;
  } catch (error) {
    console.error('Failed to connect to thermal printer:', error);
    return null;
  }
};

/**
 * Print to thermal printer (placeholder for future enhancement)
 */
export const printToThermalPrinter = async (
  receiptContent: string,
  device?: BluetoothDevice
): Promise<void> => {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Connect to the thermal printer via Bluetooth
  // 2. Format the content for thermal printing (ESC/POS commands)
  // 3. Send the formatted data to the printer
  
  throw new Error('Thermal printer support is not yet implemented');
};