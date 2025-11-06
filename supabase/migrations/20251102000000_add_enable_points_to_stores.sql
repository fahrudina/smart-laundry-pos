-- Add enable_points configuration to stores table
-- This allows each store to enable/disable the points reward system independently

-- Add enable_points column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS enable_points BOOLEAN NOT NULL DEFAULT false;

-- Create index for performance (filtering by stores with points enabled)
CREATE INDEX IF NOT EXISTS idx_stores_enable_points ON public.stores(enable_points);

-- Add comment for documentation
COMMENT ON COLUMN public.stores.enable_points IS 'Enable loyalty points reward system for this store. When true, customers earn points for paid orders.';

-- Update existing stores to have points disabled by default
-- Store owners can manually enable it after deployment
UPDATE public.stores SET enable_points = false WHERE enable_points IS NULL;

-- Display current configuration status
SELECT
  id,
  name,
  enable_points,
  CASE
    WHEN enable_points THEN '✅ Points Enabled'
    ELSE '❌ Points Disabled'
  END as points_status
FROM public.stores
ORDER BY name;

-- Summary
SELECT
  '==========================================',
  'MIGRATION COMPLETE',
  'Column enable_points added to stores table',
  'Default: false (disabled)',
  'Store owners can enable via Store Settings',
  '==========================================';
