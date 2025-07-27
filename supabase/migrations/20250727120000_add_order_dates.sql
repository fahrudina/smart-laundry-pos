-- Add order_date and estimated_completion columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Add estimated_completion column to order_items table for individual item tracking
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Create index for estimated_completion for better querying
CREATE INDEX IF NOT EXISTS idx_orders_estimated_completion ON public.orders(estimated_completion);
CREATE INDEX IF NOT EXISTS idx_order_items_estimated_completion ON public.order_items(estimated_completion);

-- Update existing orders to have order_date = created_at if order_date is null
UPDATE public.orders 
SET order_date = created_at 
WHERE order_date IS NULL;
