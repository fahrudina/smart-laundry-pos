-- ROLLBACK migration for 20251031000000_create_base_points_tables.sql
-- WARNING: This will delete all points data. Use with caution!
-- Only run this if you need to completely remove the points system

-- ==========================================
-- DANGER ZONE: This will permanently delete all points data
-- ==========================================

-- Before running, consider backing up your data:
-- pg_dump -h your-host -U your-user -t points -t point_transactions your-db > points_backup.sql

-- Drop triggers first
DROP TRIGGER IF EXISTS update_point_transactions_updated_at ON public.point_transactions;
DROP TRIGGER IF EXISTS update_points_updated_at ON public.points;

-- Drop tables (CASCADE will also drop dependent objects)
DROP TABLE IF EXISTS public.point_transactions CASCADE;
DROP TABLE IF EXISTS public.points CASCADE;

-- Drop function if no other tables use it
-- Uncomment if you're sure no other tables use this function:
-- DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Note: This rollback does NOT remove columns added by 20251101000000 migration
-- If you also want to rollback that migration, you need to:
-- 1. Remove customer_phone and store_id from points table
-- 2. Remove order_id from point_transactions table
-- 3. Remove points_earned from orders table
-- 4. Drop calculate_order_points() function

SELECT
  '==========================================',
  'ROLLBACK COMPLETE',
  'Points tables have been dropped.',
  'All points data has been deleted.',
  '==========================================';
