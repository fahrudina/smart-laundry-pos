-- Verification script for points tables
-- Run this in your Supabase SQL Editor to verify the points system is properly set up

-- ==========================================
-- 1. Check if tables exist
-- ==========================================
SELECT
  tablename,
  schemaname,
  CASE
    WHEN tablename IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename;

-- ==========================================
-- 2. Check table structures
-- ==========================================
SELECT
  'points' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'points'
ORDER BY ordinal_position;

SELECT
  'point_transactions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'point_transactions'
ORDER BY ordinal_position;

-- ==========================================
-- 3. Check for required columns (from enhancement migration)
-- ==========================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'points' AND column_name = 'customer_phone'
    ) THEN '✅ customer_phone exists in points'
    ELSE '❌ customer_phone missing in points (run 20251101000000 migration)'
  END as customer_phone_status;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'points' AND column_name = 'store_id'
    ) THEN '✅ store_id exists in points'
    ELSE '❌ store_id missing in points (run 20251101000000 migration)'
  END as store_id_status;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'point_transactions' AND column_name = 'order_id'
    ) THEN '✅ order_id exists in point_transactions'
    ELSE '❌ order_id missing in point_transactions (run 20251101000000 migration)'
  END as order_id_status;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'points_earned'
    ) THEN '✅ points_earned exists in orders'
    ELSE '❌ points_earned missing in orders (run 20251101000000 migration)'
  END as points_earned_status;

-- ==========================================
-- 4. Check indexes
-- ==========================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename, indexname;

-- ==========================================
-- 5. Check constraints
-- ==========================================
SELECT
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
  END as type_description,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid IN ('public.points'::regclass, 'public.point_transactions'::regclass)
ORDER BY table_name, constraint_type;

-- ==========================================
-- 6. Check RLS policies
-- ==========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename, policyname;

-- ==========================================
-- 7. Check if calculate_order_points function exists
-- ==========================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'calculate_order_points'
    ) THEN '✅ calculate_order_points() function exists'
    ELSE '❌ calculate_order_points() function missing (run 20251101000000 migration)'
  END as function_status;

-- ==========================================
-- 8. Test calculate_order_points function (if exists)
-- ==========================================
-- Uncomment to test with a real order ID:
-- SELECT calculate_order_points('your-order-uuid-here');

-- ==========================================
-- 9. Count existing data
-- ==========================================
SELECT
  'points' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT customer_phone) as unique_customers,
  COUNT(DISTINCT store_id) as unique_stores,
  SUM(accumulated_points) as total_points_issued,
  SUM(current_points) as total_points_available
FROM points;

SELECT
  'point_transactions' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN transaction_type = 'earning' THEN 1 END) as earning_transactions,
  COUNT(CASE WHEN transaction_type = 'redemption' THEN 1 END) as redemption_transactions,
  SUM(CASE WHEN transaction_type = 'earning' THEN points_changed ELSE 0 END) as total_earned,
  ABS(SUM(CASE WHEN transaction_type = 'redemption' THEN points_changed ELSE 0 END)) as total_redeemed
FROM point_transactions;

-- ==========================================
-- 10. Check for orphaned records
-- ==========================================
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No orphaned point_transactions'
    ELSE '⚠️ ' || COUNT(*) || ' orphaned point_transactions (missing point_id reference)'
  END as orphan_status
FROM point_transactions pt
LEFT JOIN points p ON pt.point_id = p.point_id
WHERE p.point_id IS NULL;

-- ==========================================
-- Summary
-- ==========================================
SELECT
  '==========================================',
  'VERIFICATION COMPLETE',
  'Review all checks above. All ✅ means system is ready.',
  'Any ❌ or ⚠️ requires attention.',
  '==========================================';
