-- Migration: Add WhatsApp Sender Registration Tracking
-- Purpose: Track WhatsApp sender registration status for each store
-- Created: 2026-01-26

-- Add columns to track WhatsApp sender registration status
ALTER TABLE public.stores 
  ADD COLUMN wa_sender_registered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN wa_sender_id VARCHAR(50),
  ADD COLUMN wa_sender_registered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN wa_sender_last_verified TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_stores_wa_sender_registered ON public.stores(wa_sender_registered);
CREATE INDEX idx_stores_wa_sender_id ON public.stores(wa_sender_id);

-- Add comments for documentation
COMMENT ON COLUMN public.stores.wa_sender_registered IS 'Whether this store phone number is registered as WhatsApp sender in WhatsPoints service';
COMMENT ON COLUMN public.stores.wa_sender_id IS 'WhatsApp sender ID from WhatsPoints service (phone number without special characters)';
COMMENT ON COLUMN public.stores.wa_sender_registered_at IS 'Timestamp when sender was first registered with WhatsPoints';
COMMENT ON COLUMN public.stores.wa_sender_last_verified IS 'Last time sender status was verified against WhatsPoints API';
