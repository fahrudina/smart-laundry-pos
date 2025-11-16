-- Function to change user password
-- Verifies the current password and updates to the new password
CREATE OR REPLACE FUNCTION public.change_user_password(
  user_id UUID,
  current_password TEXT,
  new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  password_valid BOOLEAN;
BEGIN
  -- Verify current password
  SELECT EXISTS(
    SELECT 1 
    FROM public.users u
    WHERE u.id = user_id
      AND u.password_hash = crypt(current_password, u.password_hash)
      AND u.is_active = true
  ) INTO password_valid;
  
  -- If current password is invalid, return false
  IF NOT password_valid THEN
    RAISE EXCEPTION 'Password saat ini tidak sesuai';
  END IF;
  
  -- Update to new password
  UPDATE public.users
  SET password_hash = crypt(new_password, gen_salt('bf', 12)),
      updated_at = now()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
