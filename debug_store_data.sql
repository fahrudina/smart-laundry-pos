-- Verify multi-tenant data setup and user store assignments
-- This will help us debug why staff can see other stores' data

-- Check if demo users exist and have correct store assignments
SELECT 
  u.id,
  u.email,
  u.role,
  u.store_id,
  s.name as store_name,
  s.owner_id
FROM public.users u
LEFT JOIN public.stores s ON u.store_id = s.id
WHERE u.email IN ('staff1@example.com', 'staff2@example.com', 'owner@example.com')
ORDER BY u.email;

-- Check if get_user_stores function works correctly
-- This should return only the stores accessible to the current user
-- For staff: only their assigned store
-- For owners: all stores they own

-- Show sample customers and their store assignments
SELECT 
  c.id,
  c.name,
  c.phone,
  c.store_id,
  s.name as store_name
FROM public.customers c
LEFT JOIN public.stores s ON c.store_id = s.id
ORDER BY c.store_id, c.name
LIMIT 10;

-- Show sample orders and their store assignments
SELECT 
  o.id,
  o.customer_name,
  o.customer_phone,
  o.store_id,
  s.name as store_name,
  o.created_at
FROM public.orders o
LEFT JOIN public.stores s ON o.store_id = s.id
ORDER BY o.store_id, o.created_at DESC
LIMIT 10;
