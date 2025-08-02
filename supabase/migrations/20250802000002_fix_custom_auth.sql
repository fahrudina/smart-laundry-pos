-- Fix RLS policies and functions to work with custom authentication
-- Instead of relying on auth.uid(), we'll pass user_id as parameter

-- Update get_user_stores function to take user_id parameter
CREATE OR REPLACE FUNCTION public.get_user_stores(user_id UUID)
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  store_description TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  is_owner BOOLEAN,
  is_active BOOLEAN
) AS $$
DECLARE
  current_user_role TEXT;
  current_user_store_id UUID;
BEGIN
  SELECT role, store_id INTO current_user_role, current_user_store_id
  FROM public.users 
  WHERE id = user_id;
  
  IF current_user_role = 'laundry_owner' THEN
    -- Return all stores owned by this user
    RETURN QUERY
    SELECT 
      s.id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      true as is_owner,
      s.is_active
    FROM public.stores s
    WHERE s.owner_id = user_id
    ORDER BY s.created_at DESC;
  ELSE
    -- Return only the store assigned to this staff member
    RETURN QUERY
    SELECT 
      s.id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      false as is_owner,
      s.is_active
    FROM public.stores s
    WHERE s.id = current_user_store_id
    AND s.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_store function to take user_id parameter
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
  
  RETURN new_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update assign_staff_to_store function to take user_id parameter  
CREATE OR REPLACE FUNCTION public.assign_staff_to_store(
  user_id UUID,
  staff_user_id UUID,
  target_store_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  store_owner_id UUID;
BEGIN
  -- Check if current user is a laundry owner
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = user_id;
  
  IF current_user_role != 'laundry_owner' THEN
    RAISE EXCEPTION 'Only laundry owners can assign staff to stores';
  END IF;

  -- Check if the store belongs to the current user
  SELECT owner_id INTO store_owner_id 
  FROM public.stores 
  WHERE id = target_store_id;
  
  IF store_owner_id != user_id THEN
    RAISE EXCEPTION 'You can only assign staff to your own stores';
  END IF;

  -- Update the staff user's store assignment
  UPDATE public.users 
  SET store_id = target_store_id, updated_at = now()
  WHERE id = staff_user_id AND role = 'staff';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auto-assignment triggers to work with custom auth
-- We'll modify them to use a different approach since auth.uid() won't work

-- Drop the existing triggers and functions
DROP TRIGGER IF EXISTS set_customer_store_id_trigger ON public.customers;
DROP TRIGGER IF EXISTS set_order_store_id_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.set_customer_store_id();
DROP FUNCTION IF EXISTS public.set_order_store_id();

-- For now, we'll handle store_id assignment in the application layer
-- since we don't have access to the current user context in triggers with custom auth
