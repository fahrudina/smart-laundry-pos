-- Test if Points Feature is Working
-- Run this in Supabase SQL Editor to diagnose the issue

-- ===========================================
-- STEP 1: Verify the function was updated
-- ===========================================
SELECT
  '=== STEP 1: Function Verification ===' as step,
  proname as function_name,
  pg_get_function_result(oid) as function_returns
FROM pg_proc
WHERE proname = 'get_user_stores_by_userid';

-- Expected: Should see 'enable_qr boolean, enable_points boolean' in the result

-- ===========================================
-- STEP 2: Test the function with a real user
-- ===========================================
-- REPLACE 'your-user-id' with an actual user ID from your database

-- First, get a user ID:
SELECT
  '=== STEP 2: Get User IDs ===' as step,
  id as user_id,
  email,
  role
FROM users
WHERE is_active = true
LIMIT 5;

-- Copy one of the user_id values above, then run this:
-- SELECT * FROM get_user_stores_by_userid('paste-user-id-here');

-- Expected columns: store_id, store_name, store_description, store_address,
--                   store_phone, store_email, is_owner, is_active,
--                   enable_qr, enable_points

-- ===========================================
-- STEP 3: Check stores table has enable_points
-- ===========================================
SELECT
  '=== STEP 3: Stores Table Check ===' as step,
  id,
  name,
  enable_qr,
  enable_points,
  CASE
    WHEN enable_points = true THEN '✅ Points ENABLED'
    WHEN enable_points = false THEN '⚠️ Points DISABLED (turn on in settings)'
    WHEN enable_points IS NULL THEN '❌ Column missing (migration failed)'
  END as points_status
FROM stores
ORDER BY created_at DESC;

-- Expected: All stores should have enable_points column with true/false value

-- ===========================================
-- STEP 4: Check points tables exist
-- ===========================================
SELECT
  '=== STEP 4: Points Tables ===' as step,
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename;

-- Expected: 2 rows (points and point_transactions)

-- ===========================================
-- STEP 5: Check orders table has points_earned
-- ===========================================
SELECT
  '=== STEP 5: Orders Column Check ===' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name = 'points_earned';

-- Expected: 1 row showing points_earned column

-- ===========================================
-- STEP 6: Check recent orders
-- ===========================================
SELECT
  '=== STEP 6: Recent Orders ===' as step,
  o.id,
  o.customer_name,
  o.customer_phone,
  o.payment_status,
  o.total_amount,
  COALESCE(o.points_earned, 0) as points_earned,
  o.created_at,
  CASE
    WHEN o.payment_status != 'paid' THEN '⚠️ Not paid (no points awarded)'
    WHEN o.points_earned > 0 THEN '✅ Points awarded'
    WHEN o.points_earned = 0 OR o.points_earned IS NULL THEN '❌ No points (check enable_points)'
  END as point_status
FROM orders o
ORDER BY o.created_at DESC
LIMIT 10;

-- ===========================================
-- STEP 7: Check if any customer has points
-- ===========================================
SELECT
  '=== STEP 7: Customer Points ===' as step,
  p.customer_phone,
  p.accumulated_points,
  p.current_points,
  s.name as store_name,
  p.created_at
FROM points p
JOIN stores s ON p.store_id = s.id
ORDER BY p.created_at DESC
LIMIT 10;

-- If no rows: No points have been awarded yet

-- ===========================================
-- STEP 8: Check point transactions
-- ===========================================
SELECT
  '=== STEP 8: Point Transactions ===' as step,
  pt.transaction_id,
  pt.points_changed,
  pt.transaction_type,
  pt.order_id,
  o.customer_name,
  pt.transaction_date
FROM point_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
ORDER BY pt.transaction_date DESC
LIMIT 10;

-- If no rows: No point transactions have occurred yet

-- ===========================================
-- SUMMARY: What to check
-- ===========================================
SELECT
  '=========================================='::text as separator,
  'DIAGNOSTIC SUMMARY'::text as title,
  '=========================================='::text as separator2;

SELECT
  'Check 1: Function returns enable_points' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'get_user_stores_by_userid'
        AND pg_get_function_result(oid) LIKE '%enable_points%'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Rerun migration'
  END as status;

SELECT
  'Check 2: Stores have enable_points column' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'enable_points'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Run 20251102000000 migration'
  END as status;

SELECT
  'Check 3: At least one store has points enabled' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM stores WHERE enable_points = true
    ) THEN '✅ PASS'
    ELSE '⚠️ WARNING - Enable points in Store Settings'
  END as status;

SELECT
  'Check 4: Points tables exist' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'points'
    ) AND EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'point_transactions'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Run 20251101000000 migration'
  END as status;

SELECT
  'Check 5: Orders have points_earned column' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'points_earned'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Run 20251101000000 migration'
  END as status;

-- ===========================================
-- ACTION ITEMS BASED ON RESULTS
-- ===========================================
SELECT
  '=========================================='::text as separator,
  'ACTION ITEMS'::text as title,
  '=========================================='::text as separator2;

SELECT
  '1. If Check 1 FAILS:' as action,
  'Rerun: 20251107000000_fix_get_user_stores_add_enable_points.sql' as solution;

SELECT
  '2. If Check 2 FAILS:' as action,
  'Run: 20251102000000_add_enable_points_to_stores.sql' as solution;

SELECT
  '3. If Check 3 is WARNING:' as action,
  'Enable points in app: Store Settings → Enable Points Rewards → Save' as solution;

SELECT
  '4. If Check 4 FAILS:' as action,
  'Run: 20251101000000_create_customer_points_system.sql' as solution;

SELECT
  '5. After all checks pass:' as action,
  'Create a paid order and verify points are awarded' as solution;

-- ===========================================
-- FINAL TEST: Create test data
-- ===========================================
-- Uncomment to create test data (only if you want to test)
/*
-- Get a store ID where points are enabled
DO $$
DECLARE
  test_store_id UUID;
  test_order_id UUID;
BEGIN
  SELECT id INTO test_store_id FROM stores WHERE enable_points = true LIMIT 1;

  IF test_store_id IS NOT NULL THEN
    -- Create test order
    INSERT INTO orders (
      customer_name,
      customer_phone,
      subtotal,
      tax_amount,
      total_amount,
      execution_status,
      payment_status,
      store_id,
      points_earned
    ) VALUES (
      'Test Customer',
      '081234567890',
      50000,
      5000,
      55000,
      'in_queue',
      'paid',
      test_store_id,
      5
    ) RETURNING id INTO test_order_id;

    -- Create test order item
    INSERT INTO order_items (
      order_id,
      service_name,
      service_price,
      quantity,
      line_total,
      service_type,
      weight_kg
    ) VALUES (
      test_order_id,
      'Test Laundry',
      10000,
      5,
      50000,
      'kilo',
      5.0
    );

    -- Create points record
    INSERT INTO points (
      customer_phone,
      accumulated_points,
      current_points,
      store_id
    ) VALUES (
      '081234567890',
      5,
      5,
      test_store_id
    ) ON CONFLICT (customer_phone, store_id) DO UPDATE SET
      accumulated_points = points.accumulated_points + 5,
      current_points = points.current_points + 5;

    RAISE NOTICE 'Test data created successfully!';
  ELSE
    RAISE NOTICE 'No store with points enabled. Enable points first!';
  END IF;
END $$;
*/
