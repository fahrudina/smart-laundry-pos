-- Auto-seed default services whenever a store is created.
--
-- Why: A brand-new store starts with zero services, which hard-blocks the POS
-- (the order screen shows "Belum ada layanan yang dikonfigurasi" and the owner
-- must manually go set up services before they can create their first order).
-- Seeding 3 ready-to-use services removes that activation wall so the POS works
-- immediately after signup. Owners can edit/delete these later.
--
-- This updates the create_store(user_id, ...) overload used by the app
-- (authService.createStoreForUser / createStore) to insert default services in
-- the same transaction as the store.

CREATE OR REPLACE FUNCTION public.create_store(
  user_id UUID,
  store_name TEXT,
  store_description TEXT DEFAULT NULL,
  store_address TEXT DEFAULT NULL,
  store_phone TEXT DEFAULT NULL,
  store_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_store_id UUID;
  current_user_role TEXT;
BEGIN
  -- Check if user has permission to create stores
  SELECT role INTO current_user_role
  FROM public.users
  WHERE id = user_id;

  IF current_user_role != 'laundry_owner' THEN
    RAISE EXCEPTION 'Only laundry owners can create stores';
  END IF;

  INSERT INTO public.stores (name, description, address, phone, email, owner_id)
  VALUES (
    store_name,
    store_description,
    store_address,
    store_phone,
    store_email,
    user_id
  )
  RETURNING id INTO new_store_id;

  -- Seed default services so the POS is usable immediately.
  -- Keep these in sync with DEFAULT_SERVICES in src/hooks/useServices.ts.
  INSERT INTO public.services
    (store_id, name, description, category, unit_price, kilo_price, supports_unit, supports_kilo, duration_value, duration_unit, is_active)
  VALUES
    (new_store_id, 'Cuci Setrika Regular', 'Cuci - Pengeringan - Setrika - Packing', 'wash', 18000, 6000, true, true, 2, 'days', true),
    (new_store_id, 'Express Wash', 'Pencucian cepat dalam 24 jam', 'wash', 25000, 8000, true, true, 1, 'days', true),
    (new_store_id, 'Setrika Saja', 'Layanan setrika dan pressing saja', 'ironing', 5000, 3000, true, true, 4, 'hours', true);

  RETURN new_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_store(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) IS
  'Creates a store for a laundry_owner and seeds 3 default services so the POS is usable immediately after signup.';
