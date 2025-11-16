-- Add discount fields to orders table
-- This migration adds support for discount (both custom and points-based) to orders

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0;

-- Add comments to explain the columns
COMMENT ON COLUMN public.orders.discount_amount IS 'Total discount amount applied to the order (in Rupiah)';
COMMENT ON COLUMN public.orders.points_redeemed IS 'Number of customer loyalty points redeemed for this order';

-- Create index for querying orders with discounts
CREATE INDEX IF NOT EXISTS idx_orders_discount ON public.orders(discount_amount) WHERE discount_amount > 0;
CREATE INDEX IF NOT EXISTS idx_orders_points_redeemed ON public.orders(points_redeemed) WHERE points_redeemed > 0;
