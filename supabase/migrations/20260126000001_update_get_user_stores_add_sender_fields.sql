-- Update get_user_stores_by_userid function to include WhatsApp sender registration fields
-- This migration adds wa_sender_registered, wa_sender_id, wa_sender_registered_at, and wa_sender_last_verified

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_stores_by_userid(UUID);

-- Recreate the function with sender registration fields included
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
  wa_use_store_number BOOLEAN,
  wa_sender_registered BOOLEAN,
  wa_sender_id VARCHAR(50),
  wa_sender_registered_at TIMESTAMP WITH TIME ZONE,
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
      COALESCE(s.enable_points, false) as enable_points,
      COALESCE(s.wa_use_store_number, false) as wa_use_store_number,
      COALESCE(s.wa_sender_registered, false) as wa_sender_registered,
      s.wa_sender_id,
      s.wa_sender_registered_at,
      s.wa_sender_last_verified
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
      COALESCE(s.enable_points, false) as enable_points,
      COALESCE(s.wa_use_store_number, false) as wa_use_store_number,
      COALESCE(s.wa_sender_registered, false) as wa_sender_registered,
      s.wa_sender_id,
      s.wa_sender_registered_at,
      s.wa_sender_last_verified
    FROM public.stores s
    WHERE s.id = current_user_store_id
    AND s.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_stores_by_userid IS 'Returns stores accessible by a user with all feature flags and WhatsApp sender registration status';
