-- Add cash_received column to orders table for cash payment change calculation
ALTER TABLE public.orders
ADD COLUMN cash_received NUMERIC;

-- Add a comment for documentation
COMMENT ON COLUMN public.orders.cash_received IS 'The amount of cash received from the customer for cash payments, used to calculate change.';

-- Create index for better performance on cash_received queries
CREATE INDEX IF NOT EXISTS idx_orders_cash_received ON public.orders(cash_received) WHERE cash_received IS NOT NULL;
