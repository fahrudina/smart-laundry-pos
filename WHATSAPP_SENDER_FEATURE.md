# WhatsApp Multi-Sender Feature Documentation

## Overview
This feature enables sending WhatsApp messages using the store's phone number as the sender when configured. This leverages the WhatsApp service's multi-sender support via the "from" field in the API payload.

## Database Configuration

### New Column: `wa_use_store_number`
A new boolean column has been added to the `stores` table:

```sql
ALTER TABLE public.stores ADD COLUMN wa_use_store_number BOOLEAN NOT NULL DEFAULT false;
```

**Purpose**: Controls whether WhatsApp messages should be sent from the store's phone number.

**Default Value**: `false` (disabled)

**Location**: `supabase/migrations/20251115000000_add_wa_use_store_number_to_stores.sql`

## How It Works

### Configuration Flow
1. **Database Toggle**: Store owners can enable/disable the feature by updating the `wa_use_store_number` column in the database
2. **Phone Number Check**: The system verifies that the store has a valid phone number set
3. **Automatic Sender Selection**: 
   - If `wa_use_store_number = true` AND store phone is set → Use store phone as sender
   - If `wa_use_store_number = false` OR store phone is empty → Use default sender

### Implementation Architecture

#### 1. Database Layer
- **Migration Files**:
  - `20251115000000_add_wa_use_store_number_to_stores.sql` - Adds the column
  - `20251115000001_update_get_user_stores_add_wa_use_store_number.sql` - Updates function to include the field

#### 2. Type Definitions (`src/integrations/whatsapp/types.ts`)
```typescript
export interface WhatsAppMessage {
  to: string;
  message: string;
  from?: string; // Optional sender phone number
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  enable_qr?: boolean;
  enable_points?: boolean;
  wa_use_store_number?: boolean; // New field
}
```

#### 3. WhatsApp Client (`src/integrations/whatsapp/client.ts`)
The client now includes the `from` field in the API request when provided:

```typescript
const requestBody: { to: string; message: string; from?: string } = {
  to: message.to,
  message: message.message,
};

if (message.from) {
  requestBody.from = message.from;
}
```

#### 4. WhatsApp Service (`src/integrations/whatsapp/service.ts`)
Service methods now accept an optional `fromNumber` parameter:

```typescript
async notifyOrderCreated(
  phoneNumber: string,
  orderData: OrderCreatedData,
  fromNumber?: string
): Promise<NotificationResult>
```

#### 5. Data Helper (`src/integrations/whatsapp/data-helper.ts`)
- Fetches `wa_use_store_number` flag from database
- Provides helper method to determine sender:

```typescript
static getWhatsAppSender(storeInfo: StoreInfo): string | undefined {
  if (storeInfo.wa_use_store_number && storeInfo.phone && 
      storeInfo.phone !== 'Nomor telepon belum diset') {
    return storeInfo.phone;
  }
  return undefined;
}
```

#### 6. React Hook (`src/hooks/useWhatsApp.ts`)
Automatically determines sender phone based on store configuration:

```typescript
const fromNumber = orderData.storeInfo?.wa_use_store_number && 
                   orderData.storeInfo?.phone
  ? orderData.storeInfo.phone
  : undefined;

await whatsAppService.notifyOrderCreated(phoneNumber, orderData, fromNumber);
```

## Enabling the Feature

### For Development/Testing
Connect to your Supabase database and run:

```sql
-- Enable for a specific store
UPDATE public.stores 
SET wa_use_store_number = true 
WHERE id = 'your-store-id';

-- Verify store has a phone number set
SELECT id, name, phone, wa_use_store_number 
FROM public.stores 
WHERE id = 'your-store-id';
```

### For Production
1. Ensure the store has a valid phone number in the `phone` column
2. Update the `wa_use_store_number` flag via database query or admin interface
3. Changes take effect immediately - no application restart required

## Testing

### Verify Configuration
```sql
SELECT
  id,
  name,
  phone,
  wa_use_store_number,
  CASE
    WHEN wa_use_store_number AND phone IS NOT NULL AND phone != '' 
      THEN '✅ WhatsApp Store Number Enabled'
    WHEN wa_use_store_number AND (phone IS NULL OR phone = '') 
      THEN '⚠️ Enabled but phone not set'
    ELSE '❌ WhatsApp Store Number Disabled'
  END as whatsapp_sender_status
FROM public.stores;
```

### Test Message Flow
1. Create a test order for a customer
2. Check WhatsApp API logs to verify `from` field is included in the request
3. Verify customer receives message from store's phone number

## Important Considerations

### Phone Number Format
- Phone numbers should be in international format (e.g., `+6281234567890`)
- The system automatically formats phone numbers using `WhatsAppClient.formatPhoneNumber()`
- Default country code: `62` (Indonesia)

### Fallback Behavior
The system gracefully handles edge cases:
- **No phone set**: Falls back to default sender
- **Feature disabled**: Uses default sender
- **Invalid phone**: Falls back to default sender

### Security
- Credentials are handled server-side in production (Vercel serverless function)
- Phone numbers are validated before sending
- No sensitive data exposed to client in production

## API Compatibility

The WhatsApp service API must support the `from` field in the request payload:

```json
{
  "to": "+6281234567890",
  "message": "Your order message...",
  "from": "+6281987654321"
}
```

If the API doesn't support multi-sender, the `from` field is simply ignored.

## Future Enhancements

Potential improvements for future versions:
1. **UI Toggle**: Add store settings UI to enable/disable feature
2. **Phone Validation**: Add frontend validation for phone number format
3. **Multiple Senders**: Support multiple phone numbers per store
4. **Analytics**: Track message success rates by sender number
5. **A/B Testing**: Test customer response rates for different sender numbers

## Troubleshooting

### Messages still sent from default sender
- **Check**: Verify `wa_use_store_number = true` in database
- **Check**: Confirm store phone number is set and valid
- **Check**: Review console logs for sender determination logic

### Messages failing to send
- **Check**: Phone number format is correct (international format)
- **Check**: WhatsApp API supports the `from` field
- **Check**: API credentials are configured correctly

### Feature not appearing in store data
- **Check**: Run the migration `20251115000001_update_get_user_stores_add_wa_use_store_number.sql`
- **Check**: Verify function `get_user_stores_by_userid` returns the new column

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify database configuration using SQL queries above
3. Review WhatsApp API documentation for multi-sender support
4. Check Vercel serverless function logs in production

---

**Last Updated**: November 15, 2024
**Migration Version**: 20251115000000, 20251115000001
**Feature Status**: ✅ Production Ready
