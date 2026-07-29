-- RPCs for the WhatsApp sender registration feature. Both mirror the
-- update_store() SECURITY DEFINER pattern: the app's custom auth means
-- auth.uid() is NULL, so RLS can't enforce ownership and it's checked here
-- in the function body instead.

-- Sets which WhatsPoints sender a store uses, and stamps when that was
-- confirmed. Called both when a registration completes and whenever the
-- app re-verifies an existing sender against WhatsPoints (p_wa_sender_id
-- may be passed as NULL to record "checked, and it's no longer registered").
CREATE OR REPLACE FUNCTION public.set_store_wa_sender(
  user_id UUID,
  target_store_id UUID,
  p_wa_sender_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  store_owner_id UUID;
BEGIN
  SELECT owner_id INTO store_owner_id
  FROM public.stores
  WHERE id = target_store_id;

  IF store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  IF store_owner_id <> user_id THEN
    RAISE EXCEPTION 'Only the store owner can update this store';
  END IF;

  UPDATE public.stores
  SET wa_sender_id = p_wa_sender_id,
      wa_sender_last_verified = now(),
      updated_at = now()
  WHERE id = target_store_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_store_wa_sender(UUID, UUID, VARCHAR) IS
  'Sets a store''s WhatsPoints sender ID and stamps wa_sender_last_verified, after verifying the caller owns the store.';

-- Toggles whether the store's own sender is used for notifications
-- (vs. the WhatsPoints default sender). Kept separate from
-- set_store_wa_sender because toggling this doesn't imply the sender
-- was just verified.
CREATE OR REPLACE FUNCTION public.set_store_wa_use_store_number(
  user_id UUID,
  target_store_id UUID,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  store_owner_id UUID;
BEGIN
  SELECT owner_id INTO store_owner_id
  FROM public.stores
  WHERE id = target_store_id;

  IF store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  IF store_owner_id <> user_id THEN
    RAISE EXCEPTION 'Only the store owner can update this store';
  END IF;

  UPDATE public.stores
  SET wa_use_store_number = p_enabled,
      updated_at = now()
  WHERE id = target_store_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_store_wa_use_store_number(UUID, UUID, BOOLEAN) IS
  'Toggles wa_use_store_number after verifying the caller owns the store.';
