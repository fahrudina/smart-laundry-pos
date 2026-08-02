-- Add enable_offline_mode configuration to stores table.
-- Mirrors the enable_points pattern (20251102000000_add_enable_points_to_stores.sql):
-- opt-in per store, default off. When true, staff can create orders while
-- offline on that store; they queue locally and sync automatically once
-- connectivity returns. Scope is order creation only - no offline status
-- or payment updates, no offline points redemption.

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS enable_offline_mode BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_stores_enable_offline_mode ON public.stores(enable_offline_mode);

COMMENT ON COLUMN public.stores.enable_offline_mode IS 'Allow staff to create orders while offline for this store. Orders queue locally and sync automatically when connectivity returns. Order creation only - no offline status/payment updates or points redemption.';

-- Extend get_user_stores_by_userid to return enable_offline_mode so the
-- frontend (StoreContext -> StoreWithOwnershipInfo) can read it.
DROP FUNCTION IF EXISTS public.get_user_stores_by_userid(UUID);

CREATE OR REPLACE FUNCTION public.get_user_stores_by_userid(user_id UUID)
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  store_description TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  is_owner BOOLEAN,
  is_active BOOLEAN,
  enable_qr BOOLEAN,
  enable_points BOOLEAN,
  enable_offline_mode BOOLEAN,
  wa_use_store_number BOOLEAN,
  wa_sender_id VARCHAR(50),
  wa_sender_last_verified TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_user_role TEXT;
  current_user_store_id UUID;
BEGIN
  SELECT u.role, u.store_id INTO current_user_role, current_user_store_id
  FROM public.users u
  WHERE u.id = user_id;

  IF current_user_role = 'laundry_owner' THEN
    RETURN QUERY
    SELECT
      s.id AS store_id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      true as is_owner,
      s.is_active,
      COALESCE(s.enable_qr, false) as enable_qr,
      COALESCE(s.enable_points, false) as enable_points,
      COALESCE(s.enable_offline_mode, false) as enable_offline_mode,
      COALESCE(s.wa_use_store_number, false) as wa_use_store_number,
      s.wa_sender_id,
      s.wa_sender_last_verified
    FROM public.stores s
    WHERE s.owner_id = user_id
    ORDER BY s.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT
      s.id AS store_id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      false as is_owner,
      s.is_active,
      COALESCE(s.enable_qr, false) as enable_qr,
      COALESCE(s.enable_points, false) as enable_points,
      COALESCE(s.enable_offline_mode, false) as enable_offline_mode,
      COALESCE(s.wa_use_store_number, false) as wa_use_store_number,
      s.wa_sender_id,
      s.wa_sender_last_verified
    FROM public.stores s
    WHERE s.id = current_user_store_id
    AND s.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.get_user_stores_by_userid IS 'Returns stores accessible by a user with enable_qr, enable_points, enable_offline_mode, wa_use_store_number, wa_sender_id, and wa_sender_last_verified fields for store features';

-- Extend set_store_feature_flags to also set enable_offline_mode, same
-- SECURITY DEFINER + ownership-check pattern (direct client .update() calls
-- silently affect 0 rows under this app's custom auth).
DROP FUNCTION IF EXISTS public.set_store_feature_flags(UUID, UUID, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.set_store_feature_flags(
  user_id UUID,
  target_store_id UUID,
  p_enable_qr BOOLEAN,
  p_enable_points BOOLEAN,
  p_enable_offline_mode BOOLEAN
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
  SET enable_qr = p_enable_qr,
      enable_points = p_enable_points,
      enable_offline_mode = p_enable_offline_mode,
      updated_at = now()
  WHERE id = target_store_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.set_store_feature_flags(UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) IS
  'Sets enable_qr, enable_points, and enable_offline_mode after verifying the caller owns the store.';
