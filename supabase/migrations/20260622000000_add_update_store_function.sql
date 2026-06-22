-- Allow store owners to edit their store's name/address/phone.
--
-- Why an RPC: the app uses custom (non-Supabase-Auth) auth, so auth.uid() is
-- NULL in RLS. The stores UPDATE policy ("Store owners can manage their stores")
-- therefore evaluates false for the anon role, and a direct
-- supabase.from('stores').update(...) silently updates 0 rows. This mirrors the
-- existing create_store / assign_staff_to_store SECURITY DEFINER pattern, which
-- bypasses RLS and verifies ownership in the function body instead.

CREATE OR REPLACE FUNCTION public.update_store(
  user_id UUID,
  target_store_id UUID,
  store_name TEXT,
  store_address TEXT DEFAULT NULL,
  store_phone TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  store_owner_id UUID;
BEGIN
  IF store_name IS NULL OR length(trim(store_name)) = 0 THEN
    RAISE EXCEPTION 'Store name is required';
  END IF;

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
  SET name = trim(store_name),
      address = NULLIF(trim(COALESCE(store_address, '')), ''),
      phone = NULLIF(trim(COALESCE(store_phone, '')), ''),
      updated_at = now()
  WHERE id = target_store_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_store(UUID, UUID, TEXT, TEXT, TEXT) IS
  'Updates a store''s name/address/phone after verifying the caller owns it. SECURITY DEFINER to work with the app''s custom auth.';
