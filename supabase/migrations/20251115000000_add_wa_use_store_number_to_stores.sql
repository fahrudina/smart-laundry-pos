-- Add wa_use_store_number configuration to stores table
-- This allows each store to enable/disable using their phone number as WhatsApp sender

-- Add wa_use_store_number column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS wa_use_store_number BOOLEAN NOT NULL DEFAULT false;

-- Create index for performance (filtering by stores with WhatsApp store number enabled)
CREATE INDEX IF NOT EXISTS idx_stores_wa_use_store_number ON public.stores(wa_use_store_number);

-- Add comment for documentation
COMMENT ON COLUMN public.stores.wa_use_store_number IS 'Enable using store phone number as WhatsApp sender. When true and store phone exists, messages are sent from the store number using the "from" field in WhatsApp API.';

-- Update existing stores to have this feature disabled by default
-- Store owners can manually enable it after deployment
UPDATE public.stores SET wa_use_store_number = false WHERE wa_use_store_number IS NULL;

-- Display current configuration status
SELECT
  id,
  name,
  phone,
  wa_use_store_number,
  CASE
    WHEN wa_use_store_number AND phone IS NOT NULL AND phone != '' THEN '✅ WhatsApp Store Number Enabled'
    WHEN wa_use_store_number AND (phone IS NULL OR phone = '') THEN '⚠️ Enabled but phone not set'
    ELSE '❌ WhatsApp Store Number Disabled'
  END as whatsapp_sender_status
FROM public.stores
ORDER BY name;

-- Summary
SELECT
  '==========================================',
  'MIGRATION COMPLETE',
  'Column wa_use_store_number added to stores table',
  'Default: false (disabled)',
  'Store owners can enable via Store Settings',
  'Messages will use store phone as sender when enabled and phone is set',
  '==========================================';
