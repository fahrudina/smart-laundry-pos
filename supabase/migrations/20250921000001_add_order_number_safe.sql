-- SAFE MIGRATION: Add order_number column to orders table for human-readable order identification
-- This is a NON-BREAKING migration that adds order_number as NULLABLE first
-- Format: LAU-YYYYMMDD-XXX (e.g., LAU-20250921-001)

-- Step 1: Add the order_number column as NULLABLE (safe for production)
ALTER TABLE public.orders 
ADD COLUMN order_number TEXT;

-- Step 2: Create index for better performance
CREATE INDEX CONCURRENTLY idx_orders_order_number ON public.orders(order_number);

-- Step 3: Create function to generate human-readable order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_num INTEGER;
  order_number TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Get current date in YYYYMMDD format (Asia/Jakarta timezone)
  date_part := to_char(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  
  -- Loop to handle potential race conditions
  WHILE attempt < max_attempts LOOP
    -- Get the next sequence number for today
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(order_number FROM 'LAU-' || date_part || '-(.*)') AS INTEGER)), 
      0
    ) + 1
    INTO sequence_num
    FROM public.orders 
    WHERE order_number LIKE 'LAU-' || date_part || '-%';
    
    -- Generate the order number with zero-padded sequence
    order_number := 'LAU-' || date_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    -- Check if this order number already exists (race condition protection)
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = order_number) THEN
      RETURN order_number;
    END IF;
    
    attempt := attempt + 1;
  END LOOP;
  
  -- If we couldn't generate a unique number after max_attempts, raise an error
  RAISE EXCEPTION 'Could not generate unique order number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically set order_number on INSERT for NEW orders only
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set order_number if it's not already provided and this is a new order
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger (only affects NEW orders, safe for production)
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Step 6: Add comment for documentation
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable order number in format LAU-YYYYMMDD-XXX (e.g., LAU-20250921-001). Generated automatically for new orders.';