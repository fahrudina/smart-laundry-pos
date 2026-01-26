-- Add WhatsApp sender registration fields to stores table
-- This allows stores to register their WhatsApp numbers for sending notifications

-- Add whatsapp_sender_id column to store the registered sender ID from whatspoints service
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp_sender_id VARCHAR(50);

-- Add whatsapp_sender_registered column to track if store has completed registration
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp_sender_registered BOOLEAN NOT NULL DEFAULT false;

-- Add whatsapp_sender_phone column to store the registered phone number
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp_sender_phone VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN public.stores.whatsapp_sender_id IS 'Sender ID from whatspoints service after successful WhatsApp registration. Used to identify which WhatsApp sender to use for this store.';
COMMENT ON COLUMN public.stores.whatsapp_sender_registered IS 'Indicates if the store has successfully registered a WhatsApp sender via QR code. When true, the store can use WhatsApp notifications.';
COMMENT ON COLUMN public.stores.whatsapp_sender_phone IS 'Phone number registered as WhatsApp sender. This is the number that will appear as sender when wa_use_store_number is enabled.';

-- Update existing stores to have registration disabled by default
UPDATE public.stores SET whatsapp_sender_registered = false WHERE whatsapp_sender_registered IS NULL;

-- Display current WhatsApp sender registration status
SELECT
  id,
  name,
  phone as store_phone,
  whatsapp_sender_phone,
  whatsapp_sender_id,
  whatsapp_sender_registered,
  wa_use_store_number,
  CASE
    WHEN whatsapp_sender_registered AND whatsapp_sender_id IS NOT NULL THEN '✅ Sender Registered'
    WHEN NOT whatsapp_sender_registered THEN '❌ Not Registered'
    ELSE '⚠️ Incomplete Registration'
  END as registration_status,
  CASE
    WHEN whatsapp_sender_registered AND wa_use_store_number THEN '✅ Active (Using Store Number)'
    WHEN whatsapp_sender_registered AND NOT wa_use_store_number THEN '⚠️ Registered but Store Number Not Enabled'
    ELSE '❌ Inactive'
  END as sender_status
FROM public.stores
ORDER BY name;

-- Summary
SELECT
  '==========================================',
  'WhatsApp Sender Registration Summary',
  '==========================================',
  COUNT(*) as total_stores,
  COUNT(*) FILTER (WHERE whatsapp_sender_registered = true) as registered_stores,
  COUNT(*) FILTER (WHERE whatsapp_sender_registered = false) as unregistered_stores,
  COUNT(*) FILTER (WHERE whatsapp_sender_registered = true AND wa_use_store_number = true) as active_senders
FROM public.stores;

-- Notes:
-- 1. Stores need to register via QR code through the POS interface
-- 2. After registration, whatsapp_sender_id will be populated
-- 3. Enable wa_use_store_number to use the registered sender for notifications
-- 4. One sender per store is supported
