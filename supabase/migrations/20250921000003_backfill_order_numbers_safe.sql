-- SAFE MIGRATION PART 2: Backfill existing orders with order numbers
-- This can be run separately and monitored in production
-- Run this AFTER the first migration and verify everything works

-- Step 1: Backfill existing orders with order numbers (can be run in batches)
-- This uses a safer approach that doesn't lock the entire table
DO $$
DECLARE
  order_record RECORD;
  date_part TEXT;
  sequence_num INTEGER;
  order_number TEXT;
  daily_counter INTEGER;
  batch_size INTEGER := 100; -- Process in small batches
  processed_count INTEGER := 0;
BEGIN
  -- Process orders in chronological order, in batches
  FOR order_record IN 
    SELECT id, created_at 
    FROM public.orders 
    WHERE order_number IS NULL 
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    -- Get date part for this order (Asia/Jakarta timezone)
    date_part := to_char(order_record.created_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
    
    -- Get the next sequence number for this day
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(order_number FROM 'LAU-' || date_part || '-(.*)') AS INTEGER)), 
      0
    ) + 1
    INTO sequence_num
    FROM public.orders 
    WHERE order_number LIKE 'LAU-' || date_part || '-%'
    AND id != order_record.id;
    
    -- Generate the order number
    order_number := 'LAU-' || date_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    -- Update the order
    UPDATE public.orders 
    SET order_number = order_number 
    WHERE id = order_record.id;
    
    processed_count := processed_count + 1;
    
    -- Log progress every 50 records
    IF processed_count % 50 = 0 THEN
      RAISE NOTICE 'Processed % orders', processed_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill completed. Processed % orders in this batch.', processed_count;
END
$$;

-- Step 2: Check if there are more orders to backfill
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.orders 
  WHERE order_number IS NULL;
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'There are still % orders without order numbers. Run this migration again to process more.', remaining_count;
  ELSE
    RAISE NOTICE 'All orders have been assigned order numbers!';
  END IF;
END
$$;