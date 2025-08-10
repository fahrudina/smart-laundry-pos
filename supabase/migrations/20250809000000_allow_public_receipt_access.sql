-- Allow public access to orders and stores for receipt viewing
-- This enables the public receipt page to work without authentication

-- Create a policy to allow public read access to orders for receipt viewing
DO $$ 
BEGIN
  -- Check if the policy doesn't exist before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND policyname = 'Allow public read access for receipts'
  ) THEN
    CREATE POLICY "Allow public read access for receipts" 
    ON public.orders 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Create a policy to allow public read access to stores for receipt viewing
DO $$ 
BEGIN
  -- Check if the policy doesn't exist before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stores' 
    AND policyname = 'Allow public read access for receipts'
  ) THEN
    CREATE POLICY "Allow public read access for receipts" 
    ON public.stores 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Create a policy to allow public read access to order_items for receipt viewing
DO $$ 
BEGIN
  -- Check if the policy doesn't exist before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'order_items' 
    AND policyname = 'Allow public read access for receipts'
  ) THEN
    CREATE POLICY "Allow public read access for receipts" 
    ON public.order_items 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON POLICY "Allow public read access for receipts" ON public.orders IS 'Allows public access to order data for receipt viewing without authentication';
COMMENT ON POLICY "Allow public read access for receipts" ON public.stores IS 'Allows public access to store data for receipt viewing without authentication';
COMMENT ON POLICY "Allow public read access for receipts" ON public.order_items IS 'Allows public access to order items data for receipt viewing without authentication';
