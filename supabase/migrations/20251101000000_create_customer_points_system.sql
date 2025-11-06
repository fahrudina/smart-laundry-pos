-- Enhance existing points table to work with the POS system
-- Assumes points and point_transactions tables already exist

-- Add customer_phone to points table if it doesn't exist (to link with orders)
ALTER TABLE public.points ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.points ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add index for customer_phone lookups
CREATE INDEX IF NOT EXISTS idx_points_customer_phone ON public.points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_points_store_id ON public.points(store_id);

-- Add unique constraint to prevent duplicate point records per customer per store
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_customer_phone_store_id_key'
  ) THEN
    ALTER TABLE public.points ADD CONSTRAINT points_customer_phone_store_id_key 
      UNIQUE(customer_phone, store_id);
  END IF;
END $$;

-- Add order_id to point_transactions to track which order generated the points
ALTER TABLE public.point_transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_point_transactions_order_id ON public.point_transactions(order_id);

-- Add points_earned column to orders table to cache the points calculation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_points_earned ON public.orders(points_earned);

-- Enable Row Level Security on points tables if not already enabled
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (can be restricted later)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'points' AND policyname = 'Allow all operations on points') THEN
    CREATE POLICY "Allow all operations on points" 
    ON public.points 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'point_transactions' AND policyname = 'Allow all operations on point_transactions') THEN
    CREATE POLICY "Allow all operations on point_transactions" 
    ON public.point_transactions 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- Create function to calculate points based on order items
-- This can be called from application layer after order items are inserted
CREATE OR REPLACE FUNCTION calculate_order_points(order_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  item_record RECORD;
BEGIN
  -- Calculate points from order items
  -- 1 point per KG for kilo-based services
  -- 1 point per unit for unit-based services
  FOR item_record IN 
    SELECT 
      service_type,
      quantity,
      weight_kg
    FROM public.order_items
    WHERE order_id = order_id_param
  LOOP
    IF item_record.service_type = 'kilo' AND item_record.weight_kg IS NOT NULL THEN
      -- 1 point per kilogram (rounded)
      total_points := total_points + ROUND(item_record.weight_kg)::INTEGER;
    ELSIF item_record.service_type = 'unit' THEN
      -- 1 point per unit
      total_points := total_points + item_record.quantity;
    ELSIF item_record.service_type = 'combined' THEN
      -- For combined, count both weight and units
      IF item_record.weight_kg IS NOT NULL THEN
        total_points := total_points + ROUND(item_record.weight_kg)::INTEGER;
      END IF;
      total_points := total_points + item_record.quantity;
    END IF;
  END LOOP;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN public.points.customer_phone IS 'Phone number linking points to customer orders';
COMMENT ON COLUMN public.points.store_id IS 'Store ID for multi-tenant point tracking';
COMMENT ON COLUMN public.points.accumulated_points IS 'Total points earned over lifetime';
COMMENT ON COLUMN public.points.current_points IS 'Currently available points (after redemptions)';
COMMENT ON COLUMN public.point_transactions.order_id IS 'Order that generated these points (for earning transactions)';
COMMENT ON COLUMN public.orders.points_earned IS 'Points earned from this specific order (1 point per KG or unit)';
COMMENT ON FUNCTION calculate_order_points IS 'Calculates points for an order: 1 point per KG for kilo services, 1 point per unit for unit services';
