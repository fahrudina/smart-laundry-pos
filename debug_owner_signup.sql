-- Debug script to check store data after owner signup
-- Run this in your Supabase SQL editor to debug the store issue

-- Check users table for recently created owner
SELECT 
  id, 
  email, 
  full_name,
  role,
  store_id,
  created_at 
FROM public.users 
WHERE role = 'laundry_owner' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check stores table for recently created stores
SELECT 
  id,
  name,
  description,
  address,
  phone,
  owner_id,
  is_active,
  created_at
FROM public.stores 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if the get_user_stores function returns data for a specific owner
-- Replace 'OWNER_USER_ID_HERE' with actual user ID from first query
-- SELECT * FROM public.get_user_stores('OWNER_USER_ID_HERE');

-- Check if there's a mismatch between user creation and store creation timing
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.store_id as user_store_id,
  s.id as store_id,
  s.name as store_name,
  s.owner_id as store_owner_id,
  u.created_at as user_created,
  s.created_at as store_created
FROM public.users u
LEFT JOIN public.stores s ON s.owner_id = u.id
WHERE u.role = 'laundry_owner'
ORDER BY u.created_at DESC
LIMIT 5;
