-- Verification Script for Points Feature Fix
-- Run this in Supabase SQL Editor after applying the migration

-- ==========================================
-- 1. Verify get_user_stores function signature
-- ==========================================
SELECT
  'Function Signature Check' as test_name,
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  CASE
    WHEN pg_get_function_result(oid) LIKE '%enable_points%'
         AND pg_get_function_result(oid) LIKE '%enable_qr%'
    THEN '✅ PASS - Function returns enable_points and enable_qr'
    ELSE '❌ FAIL - Function missing enable_points or enable_qr'
  END as status
FROM pg_proc
WHERE proname = 'get_user_stores';

-- ==========================================
-- 2. Test function output (replace with your user ID)
-- ==========================================
-- Uncomment and replace 'your-user-uuid-here' with an actual user ID from your users table
-- SELECT * FROM get_user_stores('your-user-uuid-here');

-- ==========================================
-- 3. Check if enable_points column exists in stores table
-- ==========================================
SELECT
  'Stores Table Column Check' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'enable_points'
    ) THEN '✅ PASS - enable_points column exists'
    ELSE '❌ FAIL - enable_points column missing'
  END as status;

-- ==========================================
-- 4. Check if enable_qr column exists in stores table
-- ==========================================
SELECT
  'Stores Table Column Check' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'enable_qr'
    ) THEN '✅ PASS - enable_qr column exists'
    ELSE '❌ FAIL - enable_qr column missing'
  END as status;

-- ==========================================
-- 5. Show current store settings
-- ==========================================
SELECT
  'Current Store Settings' as section,
  id,
  name,
  CASE WHEN enable_qr THEN '✅ QR Enabled' ELSE '❌ QR Disabled' END as qr_status,
  CASE WHEN enable_points THEN '✅ Points Enabled' ELSE '❌ Points Disabled' END as points_status
FROM public.stores
ORDER BY created_at DESC;

-- ==========================================
-- 6. Verify points tables exist
-- ==========================================
SELECT
  'Points Tables Check' as test_name,
  tablename,
  CASE
    WHEN tablename IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename;

-- ==========================================
-- 7. Check orders table has points_earned column
-- ==========================================
SELECT
  'Orders Table Column Check' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'points_earned'
    ) THEN '✅ PASS - points_earned column exists in orders'
    ELSE '❌ FAIL - points_earned column missing in orders'
  END as status;

-- ==========================================
-- 8. Sample query to check if points are being awarded
-- ==========================================
SELECT
  'Recent Orders with Points' as section,
  o.id,
  o.customer_name,
  o.customer_phone,
  o.total_amount,
  o.payment_status,
  COALESCE(o.points_earned, 0) as points_earned,
  o.created_at
FROM public.orders o
WHERE o.payment_status = 'paid'
ORDER BY o.created_at DESC
LIMIT 10;

-- ==========================================
-- 9. Summary of customer points
-- ==========================================
SELECT
  'Customer Points Summary' as section,
  p.customer_phone,
  p.accumulated_points,
  p.current_points,
  p.current_points - p.accumulated_points as redeemed_points,
  s.name as store_name
FROM public.points p
JOIN public.stores s ON p.store_id = s.id
ORDER BY p.accumulated_points DESC
LIMIT 10;

-- ==========================================
-- Summary
-- ==========================================
SELECT
  '==========================================' as separator,
  'VERIFICATION COMPLETE' as status,
  'All ✅ checks mean the fix is working properly' as note,
  'Any ❌ checks need attention' as warning,
  '==========================================' as separator2;
