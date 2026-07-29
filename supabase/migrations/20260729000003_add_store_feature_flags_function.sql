-- StoreSettingsCard currently saves enable_qr/enable_points via a direct
-- supabase.from('stores').update(...), which - like update_store() before
-- 64cf15d - silently updates 0 rows under this app's custom auth (RLS
-- can't see auth.uid(), since there isn't one). Fixing it the same way:
-- a SECURITY DEFINER RPC that checks ownership in the function body.
CREATE OR REPLACE FUNCTION public.set_store_feature_flags(
  user_id UUID,
  target_store_id UUID,
  p_enable_qr BOOLEAN,
  p_enable_points BOOLEAN
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
      updated_at = now()
  WHERE id = target_store_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_store_feature_flags(UUID, UUID, BOOLEAN, BOOLEAN) IS
  'Sets enable_qr and enable_points after verifying the caller owns the store.';
