-- Create services table for dynamic service management
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('wash', 'dry', 'special', 'ironing', 'folding')),
  
  -- Pricing options
  unit_price DECIMAL(10,2), -- Price per unit/item
  kilo_price DECIMAL(10,2), -- Price per kilogram
  
  -- Service configuration
  supports_unit BOOLEAN DEFAULT true,
  supports_kilo BOOLEAN DEFAULT false,
  
  -- Duration settings
  duration_value INTEGER NOT NULL DEFAULT 1,
  duration_unit TEXT NOT NULL DEFAULT 'days' CHECK (duration_unit IN ('hours', 'days')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (can be restricted later)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Allow all operations on services') THEN
    CREATE POLICY "Allow all operations on services" 
    ON public.services 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_store_id ON public.services(store_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample services for existing stores
INSERT INTO public.services (store_id, name, description, category, unit_price, kilo_price, supports_unit, supports_kilo, duration_value, duration_unit) 
SELECT 
  s.id as store_id,
  'Regular Wash' as name,
  'Standard washing service' as description,
  'wash' as category,
  12.99 as unit_price,
  8.99 as kilo_price,
  true as supports_unit,
  true as supports_kilo,
  2 as duration_value,
  'days' as duration_unit
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (store_id, name, description, category, unit_price, kilo_price, supports_unit, supports_kilo, duration_value, duration_unit) 
SELECT 
  s.id as store_id,
  'Express Wash' as name,
  'Fast washing service' as description,
  'wash' as category,
  19.99 as unit_price,
  14.99 as kilo_price,
  true as supports_unit,
  true as supports_kilo,
  1 as duration_value,
  'days' as duration_unit
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (store_id, name, description, category, unit_price, supports_unit, supports_kilo, duration_value, duration_unit) 
SELECT 
  s.id as store_id,
  'Dry Clean' as name,
  'Professional dry cleaning' as description,
  'dry' as category,
  24.99 as unit_price,
  true as supports_unit,
  false as supports_kilo,
  2 as duration_value,
  'days' as duration_unit
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (store_id, name, description, category, unit_price, kilo_price, supports_unit, supports_kilo, duration_value, duration_unit) 
SELECT 
  s.id as store_id,
  'Ironing Service' as name,
  'Professional ironing and pressing' as description,
  'ironing' as category,
  8.99 as unit_price,
  6.99 as kilo_price,
  true as supports_unit,
  true as supports_kilo,
  2 as duration_value,
  'hours' as duration_unit
FROM public.stores s
WHERE EXISTS (SELECT 1 FROM public.stores)
ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.services IS 'Services offered by each store with configurable pricing';
COMMENT ON COLUMN public.services.supports_unit IS 'Whether this service can be priced per unit/item';
COMMENT ON COLUMN public.services.supports_kilo IS 'Whether this service can be priced per kilogram';
COMMENT ON COLUMN public.services.unit_price IS 'Price per unit/item when supports_unit is true';
COMMENT ON COLUMN public.services.kilo_price IS 'Price per kilogram when supports_kilo is true';
