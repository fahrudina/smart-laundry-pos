-- Fix ambiguous column reference in get_user_stores function

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
  SELECT u.role, u.store_id INTO current_user_role, current_user_store_id
  FROM public.users u
  WHERE u.id = user_id;
  
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
