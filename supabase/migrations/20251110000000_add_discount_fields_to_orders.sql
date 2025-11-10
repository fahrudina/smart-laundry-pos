-- Add discount and points redemption fields to orders table
-- This migration supports customer point redemption and custom discounts

-- Add discount_amount column to track the total discount applied to an order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Add points_used column to track how many loyalty points were redeemed for this order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;

-- Create index for discount_amount to enable efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_discount_amount ON public.orders(discount_amount);

-- Create index for points_used to track point redemptions
CREATE INDEX IF NOT EXISTS idx_orders_points_used ON public.orders(points_used);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.discount_amount IS 'Total discount applied to order in Rupiah (includes point redemptions and custom discounts)';
COMMENT ON COLUMN public.orders.points_used IS 'Number of loyalty points redeemed for this order (1 point = Rp100)';

-- Add check constraint to ensure discount doesn't exceed total
ALTER TABLE public.orders ADD CONSTRAINT IF NOT EXISTS check_discount_not_exceed_subtotal 
  CHECK (discount_amount >= 0 AND discount_amount <= subtotal);

-- Add check constraint to ensure points_used is non-negative
ALTER TABLE public.orders ADD CONSTRAINT IF NOT EXISTS check_points_used_non_negative 
  CHECK (points_used >= 0);
