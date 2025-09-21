-- SAFE MIGRATION PART 3: Make order_number NOT NULL after backfill is complete
-- Only run this AFTER confirming all existing orders have order numbers
-- This should be run as a separate migration after validating the backfill

-- Step 1: Verify all orders have order numbers before proceeding
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.orders 
  WHERE order_number IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot make order_number NOT NULL: % orders still have NULL order_number. Run backfill migration first.', null_count;
  END IF;
  
  RAISE NOTICE 'All orders have order numbers. Safe to proceed with NOT NULL constraint.';
END
$$;

-- Step 2: Add NOT NULL constraint (safe now that all orders have order numbers)
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;

-- Step 3: Add unique constraint for better data integrity
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Add final comment
COMMENT ON CONSTRAINT orders_order_number_unique ON public.orders IS 'Ensures order numbers are unique across all orders';