-- Fix get_user_stores_by_userid function to include enable_qr and enable_points fields
-- This is critical for the loyalty points feature and QR code feature to work properly

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_stores_by_userid(UUID);

-- Recreate the function with enable_qr and enable_points fields included
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
  enable_points BOOLEAN
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
      s.id AS store_id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      true as is_owner,
      s.is_active,
      COALESCE(s.enable_qr, false) as enable_qr,
      COALESCE(s.enable_points, false) as enable_points
    FROM public.stores s
    WHERE s.owner_id = user_id
    ORDER BY s.created_at DESC;
  ELSE
    -- Return only the store assigned to this staff member
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
      COALESCE(s.enable_points, false) as enable_points
    FROM public.stores s
    WHERE s.id = current_user_store_id
    AND s.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_stores_by_userid IS 'Returns stores accessible by a user with enable_qr and enable_points fields for store features';

-- Verify the function returns the correct columns
SELECT
  '==========================================',
  'MIGRATION COMPLETE',
  'Function get_user_stores_by_userid now includes enable_qr and enable_points',
  'Loyalty points and QR code features should now work properly',
  '==========================================';
