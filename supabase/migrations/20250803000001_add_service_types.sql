-- Add service type support to order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('unit', 'kilo', 'combined')) DEFAULT 'unit';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_items JSONB;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on service_type queries
CREATE INDEX IF NOT EXISTS idx_order_items_service_type ON public.order_items(service_type);

-- Update existing records to have 'unit' service type (backward compatibility)
UPDATE public.order_items SET service_type = 'unit' WHERE service_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.order_items.service_type IS 'Type of service: unit (per item), kilo (by weight), or combined (both)';
COMMENT ON COLUMN public.order_items.weight_kg IS 'Weight in kilograms for kilo-based services';
COMMENT ON COLUMN public.order_items.unit_items IS 'JSON array of unit items for combined services: [{"item_name": "string", "quantity": number, "price_per_unit": number}]';
COMMENT ON COLUMN public.order_items.estimated_completion IS 'Estimated completion time for this specific service';
