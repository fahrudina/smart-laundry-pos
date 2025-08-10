# QR Code Configuration Feature Implementation

## Overview
This implementation addresses the PR review feedback to make the QR code display on receipts configurable via database settings instead of being hardcoded.

## Changes Made

### 1. Database Migration (`supabase/migrations/20250810120000_add_enable_qr_to_stores.sql`)
- Added `enable_qr` boolean column to `stores` table with default value `false`
- Created index for better query performance
- Updated `get_receipt_data` function to include the `enable_qr` field in responses
- Added proper documentation comments

### 2. Type Definitions Updates
- **`src/types/multi-tenant.ts`**: Added `enable_qr: boolean` to `Store` and `StoreWithOwnershipInfo` interfaces
- **`src/integrations/whatsapp/types.ts`**: Added `enable_qr?: boolean` to `StoreInfo` interface

### 3. Public Receipt Page Updates (`src/pages/PublicReceiptPage.tsx`)
- **Conditional QR Display**: QR code now only shows when `store.enable_qr` is `true`
- **Error Handling**: Added `onError` handler to gracefully hide QR code if image fails to load
- **Safety Fix**: Fixed division by zero error in price per kg calculation with proper validation
- **Data Handling**: Updated store info extraction to include `enable_qr` field from database

### 4. Store Settings Component (`src/components/stores/StoreSettingsCard.tsx`)
- **New Component**: Created dedicated settings card for store configuration
- **QR Toggle**: Switch to enable/disable QR code display on receipts
- **Permission Control**: Only store owners can modify settings
- **UI Feedback**: Loading states, success/error toasts, and helpful instructions
- **Configuration Guidance**: Information about uploading QR code image

### 5. Store Management Integration (`src/components/stores/StoreManagement.tsx`)
- Added `StoreSettingsCard` to the store management interface
- Settings appear when a store is selected, alongside staff management

### 6. WhatsApp Integration Fixes
- **Configurable URLs**: Replaced hardcoded `smart-laundry-pos.vercel.app` with environment-based URL detection
- **Environment Support**: Added `VITE_RECEIPT_BASE_URL` environment variable support
- **Dynamic Base URL**: Falls back to current domain in browser or default URL in build

### 7. General PR Review Fixes
- **Password Security**: Removed hardcoded password defaults from all files for better security
- **Division by Zero**: Added safe calculation for price per kg with proper error handling

## Configuration Instructions

### For Store Owners:
1. Navigate to Store Management page
2. Select your store from the list
3. Scroll down to "Store Settings" section
4. Toggle "Show QR Code on Receipts" switch
5. Click "Save Settings"

### For System Administrators:
1. Upload your payment QR code image as `/qrcode.png` in the `public` folder
2. Set `VITE_RECEIPT_BASE_URL` environment variable if needed for custom domains
3. Run the database migration to add the `enable_qr` column

## Database Schema Changes

```sql
-- New column added to stores table
ALTER TABLE public.stores ADD COLUMN enable_qr BOOLEAN NOT NULL DEFAULT false;

-- New index for performance
CREATE INDEX idx_stores_enable_qr ON public.stores(enable_qr);
```

## Environment Variables

### New Optional Variable:
```bash
# Custom base URL for receipt links in WhatsApp messages
VITE_RECEIPT_BASE_URL=https://your-custom-domain.com
```

## Migration Path

### For Existing Stores:
- All existing stores will have `enable_qr = false` by default
- Store owners must manually enable QR code display in settings
- No breaking changes to existing functionality

### For New Stores:
- QR code display is disabled by default
- Can be enabled during initial store setup or later in settings

## Benefits

1. **Configurable QR Display**: Store owners control whether QR codes appear on receipts
2. **Error Resilience**: Graceful handling of missing QR code images
3. **Performance**: Database indexing for efficient QR setting queries
4. **Maintainability**: Environment-based URL configuration for different deployments
5. **User Experience**: Clear UI for managing store settings with proper permissions

## Technical Notes

- QR code image path remains `/qrcode.png` but display is now conditional
- Settings are cached per store and updated in real-time
- All changes are backward compatible with existing receipt functionality
- WhatsApp message templates now use dynamic URLs based on deployment environment

## Testing

1. **Enable QR Code**: Toggle setting and verify QR appears on new receipts
2. **Disable QR Code**: Toggle off and verify QR is hidden
3. **Missing Image**: Test with missing `/qrcode.png` file to ensure graceful degradation
4. **Permission Check**: Verify only store owners can modify settings
5. **Environment URLs**: Test receipt links in different environments
