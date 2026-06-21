-- Google Sign-In support for the custom (non-Supabase-Auth) auth system.
--
-- Flow: the client obtains a Google ID token via @react-oauth/google, decodes
-- it for email/name/sub, then calls signin_with_google(). This RPC:
--   * logs in an existing user matched by email, OR
--   * creates a brand-new user as a laundry_owner, auto-creates a store named
--     "Toko {name}" (which seeds default services via create_store), and logs
--     them in.
--
-- Note: the Google ID token is not cryptographically verified server-side here;
-- this matches the app's existing custom-auth trust model. Move verification to
-- an edge function if stronger guarantees are required.

-- Track the Google account identifier so the same Google user maps to one row.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
  ON public.users(google_sub) WHERE google_sub IS NOT NULL;

CREATE OR REPLACE FUNCTION public.signin_with_google(
  google_email TEXT,
  google_name TEXT DEFAULT NULL,
  google_sub TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN,
  is_new BOOLEAN
) AS $$
DECLARE
  existing_user public.users%ROWTYPE;
  new_user_id UUID;
  resolved_name TEXT;
BEGIN
  IF google_email IS NULL OR length(trim(google_email)) = 0 THEN
    RAISE EXCEPTION 'Google email is required';
  END IF;

  -- Match existing accounts by email (case-insensitive).
  SELECT * INTO existing_user
  FROM public.users u
  WHERE lower(u.email) = lower(google_email)
  LIMIT 1;

  IF FOUND THEN
    IF NOT existing_user.is_active THEN
      RAISE EXCEPTION 'Account is inactive';
    END IF;

    -- Backfill the Google identifier on first Google login for this account.
    IF existing_user.google_sub IS NULL AND google_sub IS NOT NULL THEN
      UPDATE public.users SET google_sub = signin_with_google.google_sub
      WHERE id = existing_user.id;
    END IF;

    RETURN QUERY
    SELECT existing_user.id, existing_user.email, existing_user.full_name,
           existing_user.phone, existing_user.role, existing_user.is_active, false;
    RETURN;
  END IF;

  -- New user: create as a laundry owner with an unusable password (Google-only login).
  resolved_name := COALESCE(NULLIF(trim(google_name), ''), split_part(google_email, '@', 1));

  INSERT INTO public.users (email, password_hash, full_name, role, google_sub, is_active)
  VALUES (
    google_email,
    crypt(gen_random_uuid()::text, gen_salt('bf', 12)),
    resolved_name,
    'laundry_owner',
    signin_with_google.google_sub,
    true
  )
  RETURNING id INTO new_user_id;

  -- Auto-create a store (seeds default services) so the POS is usable immediately.
  PERFORM public.create_store(new_user_id, 'Toko ' || resolved_name);

  RETURN QUERY
  SELECT new_user_id, google_email, resolved_name, NULL::TEXT, 'laundry_owner'::TEXT, true, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.signin_with_google(TEXT, TEXT, TEXT) IS
  'Logs in or registers a user via Google. New users become laundry_owners with an auto-created, service-seeded store.';
