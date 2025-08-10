-- Add ready_for_pickup status to execution_status column
-- This status indicates the order is finished and ready for customer pickup

-- Update the check constraint to include the new status
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_execution_status_check;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_execution_status_check 
    CHECK (execution_status IN ('in_queue', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled'));
