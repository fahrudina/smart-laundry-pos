-- Seed test data for points system
-- Use this to populate your development/staging database with test data
-- DO NOT RUN IN PRODUCTION (unless you want test data)

-- ==========================================
-- Prerequisites: Ensure you have a test store
-- ==========================================
-- Replace 'your-test-store-id' with your actual test store UUID

DO $$
DECLARE
  test_store_id UUID := 'your-test-store-id';  -- CHANGE THIS!
  test_customer_phone TEXT := '081234567890';
  test_point_id INTEGER;
BEGIN
  -- ==========================================
  -- 1. Create test customer in points table
  -- ==========================================
  INSERT INTO public.points (
    customer_phone,
    store_id,
    accumulated_points,
    current_points
  ) VALUES (
    test_customer_phone,
    test_store_id,
    150,  -- Has earned 150 points total
    120   -- Has 120 points available (30 redeemed)
  )
  ON CONFLICT (customer_phone, store_id) DO UPDATE
  SET accumulated_points = 150, current_points = 120
  RETURNING point_id INTO test_point_id;

  RAISE NOTICE 'Created/Updated point_id: %', test_point_id;

  -- ==========================================
  -- 2. Create earning transactions (simulated past orders)
  -- ==========================================

  -- Transaction 1: Earned 50 points from order 1
  INSERT INTO public.point_transactions (
    point_id,
    points_changed,
    transaction_type,
    transaction_date,
    notes
  ) VALUES (
    test_point_id,
    50,
    'earning',
    now() - interval '30 days',
    'Points earned from test order 1'
  );

  -- Transaction 2: Earned 70 points from order 2
  INSERT INTO public.point_transactions (
    point_id,
    points_changed,
    transaction_type,
    transaction_date,
    notes
  ) VALUES (
    test_point_id,
    70,
    'earning',
    now() - interval '15 days',
    'Points earned from test order 2'
  );

  -- Transaction 3: Earned 30 points from order 3
  INSERT INTO public.point_transactions (
    point_id,
    points_changed,
    transaction_type,
    transaction_date,
    notes
  ) VALUES (
    test_point_id,
    30,
    'earning',
    now() - interval '5 days',
    'Points earned from test order 3'
  );

  -- ==========================================
  -- 3. Create redemption transaction
  -- ==========================================

  -- Transaction 4: Redeemed 30 points for discount
  INSERT INTO public.point_transactions (
    point_id,
    points_changed,
    transaction_type,
    transaction_date,
    notes
  ) VALUES (
    test_point_id,
    -30,  -- Negative for redemption
    'redemption',
    now() - interval '2 days',
    'Redeemed points for discount on order'
  );

  -- ==========================================
  -- 4. Create more test customers with varying balances
  -- ==========================================

  -- VIP Customer (high points)
  INSERT INTO public.points (
    customer_phone,
    store_id,
    accumulated_points,
    current_points
  ) VALUES (
    '082234567891',
    test_store_id,
    500,
    450
  )
  ON CONFLICT (customer_phone, store_id) DO NOTHING;

  -- New Customer (few points)
  INSERT INTO public.points (
    customer_phone,
    store_id,
    accumulated_points,
    current_points
  ) VALUES (
    '083234567892',
    test_store_id,
    15,
    15
  )
  ON CONFLICT (customer_phone, store_id) DO NOTHING;

  -- Inactive Customer (zero current points, all redeemed)
  INSERT INTO public.points (
    customer_phone,
    store_id,
    accumulated_points,
    current_points
  ) VALUES (
    '084234567893',
    test_store_id,
    200,
    0
  )
  ON CONFLICT (customer_phone, store_id) DO NOTHING;

  RAISE NOTICE 'Test data seeded successfully!';
END $$;

-- ==========================================
-- Verify seed data
-- ==========================================
SELECT
  customer_phone,
  accumulated_points,
  current_points,
  created_at,
  updated_at
FROM public.points
WHERE store_id = 'your-test-store-id'  -- CHANGE THIS!
ORDER BY accumulated_points DESC;

-- ==========================================
-- View all transactions for test customer
-- ==========================================
SELECT
  pt.transaction_type,
  pt.points_changed,
  pt.transaction_date,
  pt.notes,
  p.customer_phone,
  p.current_points
FROM public.point_transactions pt
JOIN public.points p ON p.point_id = pt.point_id
WHERE p.customer_phone = '081234567890'
ORDER BY pt.transaction_date DESC;

-- ==========================================
-- Summary statistics
-- ==========================================
SELECT
  COUNT(*) as total_customers,
  SUM(accumulated_points) as total_points_issued,
  SUM(current_points) as total_points_available,
  AVG(accumulated_points)::INTEGER as avg_points_per_customer,
  MAX(accumulated_points) as top_customer_points
FROM public.points
WHERE store_id = 'your-test-store-id';  -- CHANGE THIS!
