-- Add product/goods categories to services table
-- This allows the services table to also store product items like detergent, perfume, etc.

-- Drop the existing CHECK constraint on category
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;

-- Add new CHECK constraint that includes goods/product categories
ALTER TABLE public.services ADD CONSTRAINT services_category_check 
  CHECK (category IN (
    -- Existing service categories
    'wash', 'dry', 'special', 'ironing', 'folding',
    -- New product/goods categories
    'detergent', 'perfume', 'softener', 'other_goods'
  ));

-- Add optional field to distinguish between services and products more explicitly
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'product'));

-- Create index for better performance on item_type queries
CREATE INDEX IF NOT EXISTS idx_services_item_type ON public.services(item_type);

-- Add comment for documentation
COMMENT ON COLUMN public.services.item_type IS 'Type of item: service (laundry services) or product (goods like detergent, perfume)';
COMMENT ON COLUMN public.services.category IS 'Category of service or product: wash, dry, special, ironing, folding for services; detergent, perfume, softener, other_goods for products';

-- Insert sample product items for existing stores
-- These are common goods sold in laundry businesses
INSERT INTO public.services (
  store_id, 
  name, 
  description, 
  category, 
  item_type,
  unit_price, 
  supports_unit, 
  supports_kilo, 
  duration_value, 
  duration_unit,
  is_active
) 
SELECT 
  s.id as store_id,
  'Detergent Premium' as name,
  'High-quality laundry detergent' as description,
  'detergent' as category,
  'product' as item_type,
  25000.00 as unit_price,
  true as supports_unit,
  false as supports_kilo,
  0 as duration_value,
  'hours' as duration_unit,
  true as is_active
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (
  store_id, 
  name, 
  description, 
  category, 
  item_type,
  unit_price, 
  supports_unit, 
  supports_kilo, 
  duration_value, 
  duration_unit,
  is_active
) 
SELECT 
  s.id as store_id,
  'Parfum Laundry' as name,
  'Fresh laundry perfume/fragrance' as description,
  'perfume' as category,
  'product' as item_type,
  15000.00 as unit_price,
  true as supports_unit,
  false as supports_kilo,
  0 as duration_value,
  'hours' as duration_unit,
  true as is_active
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (
  store_id, 
  name, 
  description, 
  category, 
  item_type,
  unit_price, 
  supports_unit, 
  supports_kilo, 
  duration_value, 
  duration_unit,
  is_active
) 
SELECT 
  s.id as store_id,
  'Softener (Pelembut)' as name,
  'Fabric softener for soft clothes' as description,
  'softener' as category,
  'product' as item_type,
  20000.00 as unit_price,
  true as supports_unit,
  false as supports_kilo,
  0 as duration_value,
  'hours' as duration_unit,
  true as is_active
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (
  store_id, 
  name, 
  description, 
  category, 
  item_type,
  unit_price, 
  supports_unit, 
  supports_kilo, 
  duration_value, 
  duration_unit,
  is_active
) 
SELECT 
  s.id as store_id,
  'Stain Remover' as name,
  'Powerful stain removal product' as description,
  'other_goods' as category,
  'product' as item_type,
  18000.00 as unit_price,
  true as supports_unit,
  false as supports_kilo,
  0 as duration_value,
  'hours' as duration_unit,
  true as is_active
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

-- Update existing service records to have item_type = 'service'
UPDATE public.services 
SET item_type = 'service' 
WHERE item_type IS NULL 
  AND category IN ('wash', 'dry', 'special', 'ironing', 'folding');
