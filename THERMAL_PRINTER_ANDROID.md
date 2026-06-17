# Thermal Printer Support for Android

The Smart Laundry POS app now supports thermal receipt printing on Android devices using native Bluetooth connectivity.

## What Was Fixed

Previously, the thermal printer functionality only worked in web browsers using the Web Bluetooth API, which is not available in Android WebView/Capacitor apps. 

### Solution Implemented

1. **Created a Custom Capacitor Plugin** (`ThermalPrinterPlugin.java`)
   - Native Android Bluetooth connectivity using classic Bluetooth (SPP)
   - Direct communication with thermal printers via RFCOMM protocol
   - Supports ESC/POS commands for receipt formatting

2. **Platform Detection Layer** (`printUtilsPlatform.ts`)
   - Automatically detects if running on Android or in browser
   - Uses native plugin on Android
   - Falls back to Web Bluetooth API in browsers

3. **Updated Permissions**
   - Added Bluetooth permissions for Android 11 and below
   - Added BLUETOOTH_CONNECT and BLUETOOTH_SCAN for Android 12+
   - Properly declared Bluetooth hardware feature

## Features

### For Android App
- ✅ Native Bluetooth classic (SPP) connection to thermal printers
- ✅ List paired Bluetooth devices
- ✅ Connect/disconnect from printers
- ✅ Print formatted receipts with ESC/POS commands
- ✅ Support for 58mm thermal paper (32 characters wide)
- ✅ Automatic paper cutting and feeding

### For Web Browser
- ✅ Web Bluetooth API support (unchanged)
- ✅ Works on Chrome/Edge browsers with Bluetooth support

## How to Use in Your Code

### 1. Request Bluetooth Permissions (Android only)

```typescript
import { requestBluetoothPermissions } from '@/lib/printUtilsPlatform';

// Request permissions before using Bluetooth
const granted = await requestBluetoothPermissions();
if (!granted) {
  console.error('Bluetooth permissions denied');
}
```

### 2. List Paired Printers (Android)

```typescript
import { listPairedPrinters, isAndroid } from '@/lib/printUtilsPlatform';

if (isAndroid()) {
  const printers = await listPairedPrinters();
  console.log('Available printers:', printers);
  // [{ name: 'RPP02N', address: '00:11:22:33:44:55' }, ...]
}
```

### 3. Connect to a Printer

```typescript
import { 
  isAndroid, 
  connectNativePrinter, 
  connectThermalPrinter 
} from '@/lib/printUtilsPlatform';

if (isAndroid()) {
  // Android: Use native connection
  const connection = await connectNativePrinter('00:11:22:33:44:55');
  console.log('Connected to:', connection.deviceName);
} else {
  // Browser: Use Web Bluetooth
  const connection = await connectThermalPrinter();
  console.log('Connected via Web Bluetooth');
}
```

### 4. Print a Receipt

```typescript
import { printReceipt } from '@/lib/printUtilsPlatform';

// Print receipt for a specific order
await printReceipt('order-123', connection);
```

### 5. Disconnect

```typescript
import { 
  isAndroid, 
  disconnectNativePrinter, 
  disconnectThermalPrinter 
} from '@/lib/printUtilsPlatform';

if (isAndroid()) {
  await disconnectNativePrinter();
} else {
  disconnectThermalPrinter(connection);
}
```

## Complete Example

```typescript
import { toast } from 'sonner';
import {
  isAndroid,
  requestBluetoothPermissions,
  listPairedPrinters,
  connectNativePrinter,
  disconnectNativePrinter,
  printReceipt,
} from '@/lib/printUtilsPlatform';

async function printReceiptExample(orderId: string) {
  try {
    // 1. Check platform and request permissions
    if (isAndroid()) {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        toast.error('Bluetooth permissions required');
        return;
      }
    }

    // 2. List available printers (Android)
    let connection;
    if (isAndroid()) {
      const printers = await listPairedPrinters();
      
      if (printers.length === 0) {
        toast.error('No paired printers found. Please pair your printer in Bluetooth settings.');
        return;
      }

      // Connect to first printer (or let user choose)
      const printer = printers[0];
      toast.info(`Connecting to ${printer.name}...`);
      connection = await connectNativePrinter(printer.address);
      toast.success(`Connected to ${printer.name}`);
    } else {
      // Browser: Use Web Bluetooth
      connection = await connectThermalPrinter();
    }

    // 3. Print the receipt
    await printReceipt(orderId, connection);
    toast.success('Receipt printed successfully!');

    // 4. Disconnect
    if (isAndroid()) {
      await disconnectNativePrinter();
    }
  } catch (error) {
    console.error('Print error:', error);
    toast.error(`Failed to print: ${error.message}`);
  }
}
```

## Supported Printers

The plugin supports ESC/POS compatible thermal printers that use Bluetooth Classic (SPP). Tested with:
- **RPP02N** - 58mm thermal printer
- **MP-80M** - 80mm thermal printer
- Most generic ESC/POS thermal printers

## Setup Instructions for Users

### First Time Setup

1. **Pair Your Printer**
   - Go to Android Settings > Bluetooth
   - Turn on your thermal printer
   - Search for devices and pair with your printer
   - Note: Some printers may require a PIN (usually `0000` or `1234`)

2. **Install the App**
   - Install the APK: `/Users/macbookpro/play/smart-laundry-pos/android/app/build/outputs/apk/debug/app-debug.apk`

3. **Grant Permissions**
   - When first using the print feature, the app will request Bluetooth permissions
   - Tap "Allow" to grant permissions

4. **Test Printing**
   - Create a test order
   - Use the print button to print a receipt
   - The app will automatically connect to your paired printer

## Troubleshooting

### "No printer connected" error
- Make sure the printer is turned on
- Check that the printer is paired in Bluetooth settings
- Try re-pairing the printer

### "Permission denied" error
- Go to App Settings > Permissions
- Enable Bluetooth and Nearby Devices permissions

### Print quality issues
- Check printer paper
- Ensure printer is charged
- Clean printer head if needed

### Connection fails
- Move printer closer to phone
- Turn printer off and on
- Restart the app

## Technical Details

### Bluetooth Protocol
- Uses RFCOMM (Serial Port Profile - SPP)
- UUID: `00001101-0000-1000-8000-00805f9b34fb`
- Baud rate: Default (usually 9600 or 115200)

### ESC/POS Commands Used
- `ESC @` - Initialize printer
- `ESC E` - Bold text
- `ESC a` - Text alignment
- `GS !` - Text size
- `GS V` - Paper cut

### Receipt Format
- Paper width: 32 characters (58mm) or 42 characters (80mm)
- Font: Default thermal printer font
- Encoding: UTF-8
- Line spacing: Standard

## Files Modified/Created

1. **Android Plugin**
   - `/android/app/src/main/java/com/smartlaundry/pos/ThermalPrinterPlugin.java`
   - `/android/app/src/main/java/com/smartlaundry/pos/MainActivity.java`

2. **TypeScript Layer**
   - `/src/plugins/ThermalPrinter.ts`
   - `/src/plugins/ThermalPrinterWeb.ts`
   - `/src/lib/printUtilsPlatform.ts`

3. **Configuration**
   - `/android/app/src/main/AndroidManifest.xml` (Added Bluetooth permissions)

## Future Enhancements

Potential improvements for future versions:
- [ ] Support for Bluetooth Low Energy (BLE) printers
- [ ] Support for USB thermal printers
- [ ] Support for network (WiFi/LAN) printers
- [ ] Printer settings configuration (paper width, font size)
- [ ] QR code printing
- [ ] Logo/image printing
- [ ] Multiple printer profiles
- [ ] Print preview

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify printer compatibility (must support ESC/POS)
3. Check Android Bluetooth settings
4. Review app permissions

## Build Information

**APK Location:** `/Users/macbookpro/play/smart-laundry-pos/android/app/build/outputs/apk/debug/app-debug.apk`

**Build Date:** November 23, 2025

**Version:** 1.0 (with thermal printer support)
