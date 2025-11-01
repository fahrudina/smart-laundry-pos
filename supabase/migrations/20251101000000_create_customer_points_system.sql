-- Create customer_points table to track loyalty points
CREATE TABLE IF NOT EXISTS public.customer_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_phone, store_id)
);

-- Add points_earned column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE public.customer_points ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (can be restricted later)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_points' AND policyname = 'Allow all operations on customer_points') THEN
    CREATE POLICY "Allow all operations on customer_points" 
    ON public.customer_points 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_points_phone ON public.customer_points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_points_store_id ON public.customer_points(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_points_earned ON public.orders(points_earned);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_customer_points_updated_at 
BEFORE UPDATE ON public.customer_points 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

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
COMMENT ON TABLE public.customer_points IS 'Tracks loyalty points earned by customers per store';
COMMENT ON COLUMN public.customer_points.total_points IS 'Total accumulated points for this customer at this store';
COMMENT ON COLUMN public.orders.points_earned IS 'Points earned from this specific order (1 point per KG or unit)';
COMMENT ON FUNCTION calculate_order_points IS 'Calculates points for an order: 1 point per KG for kilo services, 1 point per unit for unit services';
