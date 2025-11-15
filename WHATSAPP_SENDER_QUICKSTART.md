# WhatsApp Sender Feature - Quick Reference

## Feature Summary
Enable sending WhatsApp messages from your store's phone number instead of a default sender.

## Quick Enable

### Step 1: Set Store Phone Number
Ensure your store has a valid phone number:
```sql
UPDATE public.stores 
SET phone = '+6281234567890'  -- Replace with your store's WhatsApp number
WHERE id = 'your-store-id';
```

### Step 2: Enable the Feature
```sql
UPDATE public.stores 
SET wa_use_store_number = true 
WHERE id = 'your-store-id';
```

### Step 3: Verify Configuration
```sql
SELECT 
  name, 
  phone, 
  wa_use_store_number,
  CASE
    WHEN wa_use_store_number AND phone IS NOT NULL THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM public.stores 
WHERE id = 'your-store-id';
```

## How It Works
- **Enabled + Phone Set**: Messages sent from store phone number
- **Disabled or No Phone**: Messages sent from default sender
- **Automatic**: No code changes needed, works immediately after database update

## Key Files Modified
- `supabase/migrations/20251115000000_add_wa_use_store_number_to_stores.sql` - Database schema
- `src/integrations/whatsapp/types.ts` - Type definitions with `from` field
- `src/integrations/whatsapp/client.ts` - API client with multi-sender support
- `src/integrations/whatsapp/service.ts` - Service layer with sender parameter
- `src/integrations/whatsapp/data-helper.ts` - Sender determination logic
- `src/hooks/useWhatsApp.ts` - Hook with automatic sender selection

## Disable the Feature
```sql
UPDATE public.stores 
SET wa_use_store_number = false 
WHERE id = 'your-store-id';
```

## Full Documentation
See [WHATSAPP_SENDER_FEATURE.md](./WHATSAPP_SENDER_FEATURE.md) for complete documentation.
