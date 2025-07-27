-- Update order status system to separate payment and execution status
-- Drop existing check constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- First, update existing payment_status values that don't match new constraints
UPDATE public.orders 
SET payment_status = 'completed' 
WHERE payment_status = 'paid';

-- Add new columns
ALTER TABLE public.orders 
  -- Add execution status (renamed from status)
  ADD COLUMN IF NOT EXISTS execution_status TEXT NOT NULL DEFAULT 'in_queue',
  
  -- Add payment method column
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  
  -- Add payment amount for down payments
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
  
  -- Add notes for payment and execution
  ADD COLUMN IF NOT EXISTS payment_notes TEXT,
  ADD COLUMN IF NOT EXISTS execution_notes TEXT;

-- Update payment status default
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Add check constraints after data is cleaned
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_execution_status_check 
    CHECK (execution_status IN ('in_queue', 'in_progress', 'completed', 'cancelled')),
  ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'completed', 'down_payment', 'refunded')),
  ADD CONSTRAINT orders_payment_method_check 
    CHECK (payment_method IN ('cash', 'qris', 'transfer') OR payment_method IS NULL);

-- Migrate existing data
-- Update execution_status based on old status values if the column exists
DO $$
BEGIN
  -- Check if the old status column exists and update data accordingly
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'orders' AND column_name = 'status' AND table_schema = 'public') THEN
    
    -- Update execution_status based on old status values
    UPDATE public.orders SET execution_status = 
      CASE 
        WHEN status = 'pending' THEN 'in_queue'
        WHEN status = 'in_progress' THEN 'in_progress' 
        WHEN status = 'completed' THEN 'completed'
        WHEN status = 'cancelled' THEN 'cancelled'
        ELSE 'in_queue'
      END;
    
    -- Drop the old status column
    ALTER TABLE public.orders DROP COLUMN status;
  END IF;
END $$;

-- Set default payment_amount to total_amount for existing completed payments
UPDATE public.orders 
SET payment_amount = total_amount 
WHERE payment_status = 'completed' AND payment_amount IS NULL;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_orders_execution_status ON public.orders(execution_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.execution_status IS 'Status of order execution: in_queue, in_progress, completed, cancelled';
COMMENT ON COLUMN public.orders.payment_status IS 'Status of payment: pending, completed, down_payment, refunded';
COMMENT ON COLUMN public.orders.payment_method IS 'Method of payment: cash, qris, transfer';
COMMENT ON COLUMN public.orders.payment_amount IS 'Amount actually paid (useful for down payments)';
COMMENT ON COLUMN public.orders.payment_notes IS 'Notes about payment';
COMMENT ON COLUMN public.orders.execution_notes IS 'Notes about order execution';
