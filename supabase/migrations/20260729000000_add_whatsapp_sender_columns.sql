-- WhatsApp sender registration: track which WhatsPoints sender a store uses.
--
-- wa_sender_id is the source of truth for the "from" field when sending
-- notifications (see src/integrations/whatsapp). stores.phone remains a
-- display/contact field only and is no longer used to derive the sender.
--
-- Backfill: for stores that already opted into wa_use_store_number, seed
-- wa_sender_id from their current phone. This preserves the (correct) sender
-- for stores whose phone happens to already be a registered WhatsPoints
-- sender, and surfaces the ones that aren't as "unverified" once the app
-- checks GET /api/senders against this value (wa_sender_last_verified stays
-- NULL until that check succeeds).
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS wa_sender_id VARCHAR(50);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS wa_sender_last_verified TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.stores.wa_sender_id IS 'WhatsPoints sender ID used as the "from" field for this store''s notifications. Source of truth, independent of stores.phone.';
COMMENT ON COLUMN public.stores.wa_sender_last_verified IS 'Last time wa_sender_id was confirmed present in WhatsPoints GET /api/senders. NULL means never verified.';

UPDATE public.stores
SET wa_sender_id = phone
WHERE wa_use_store_number = true
  AND phone IS NOT NULL
  AND phone != ''
  AND wa_sender_id IS NULL;
