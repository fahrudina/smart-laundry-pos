-- Add category and item_type fields to order_items table for better product/service distinction
-- This allows receipts to properly categorize and display products vs services

-- Add category field to track what type of service/product this is
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS category TEXT;

-- Add item_type field to explicitly distinguish between service and product
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'product'));

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_order_items_category ON public.order_items(category);
CREATE INDEX IF NOT EXISTS idx_order_items_item_type ON public.order_items(item_type);

-- Add comments for documentation
COMMENT ON COLUMN public.order_items.category IS 'Category of the service or product: wash, dry, ironing, folding for services; detergent, perfume, softener, other_goods for products';
COMMENT ON COLUMN public.order_items.item_type IS 'Type of item: service (laundry services) or product (goods like detergent, perfume)';

-- Update existing records to have item_type = 'service' by default
UPDATE public.order_items 
SET item_type = 'service' 
WHERE item_type IS NULL;
