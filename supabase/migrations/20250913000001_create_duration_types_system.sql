-- Migration: Create Service Duration Types System (Backward Compatible)
-- Phase 1: Create new tables and columns without breaking existing functionality

-- Step 1: Create service_duration_types table
CREATE TABLE IF NOT EXISTS public.service_duration_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_value INTEGER NOT NULL,
  duration_unit TEXT NOT NULL CHECK (duration_unit IN ('hours', 'days')),
  price_multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique combination per store
  UNIQUE(store_id, name)
);

-- Step 2: Add new columns to order_items (nullable for backward compatibility)
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS service_duration_type_id UUID REFERENCES public.service_duration_types(id),
ADD COLUMN IF NOT EXISTS selected_duration_value INTEGER,
ADD COLUMN IF NOT EXISTS selected_duration_unit TEXT,
ADD COLUMN IF NOT EXISTS duration_price_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- Step 3: Add base price columns to services (keep existing prices intact)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS base_unit_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS base_kilo_price DECIMAL(10,2);

-- Step 4: Enable RLS for new table
ALTER TABLE public.service_duration_types ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Allow all operations on service_duration_types" 
ON public.service_duration_types 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_duration_types_store_id ON public.service_duration_types(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_duration_type ON public.order_items(service_duration_type_id);

-- Step 7: Create function to migrate existing services to duration types
CREATE OR REPLACE FUNCTION migrate_services_to_duration_types()
RETURNS void AS $$
DECLARE
  store_record RECORD;
  service_record RECORD;
  duration_type_id UUID;
BEGIN
  -- For each store
  FOR store_record IN SELECT id, name FROM public.stores LOOP
    RAISE NOTICE 'Processing store: %', store_record.name;
    
    -- Extract unique duration combinations from this store's services
    FOR service_record IN 
      SELECT DISTINCT duration_value, duration_unit 
      FROM public.services 
      WHERE store_id = store_record.id 
      ORDER BY duration_value, duration_unit
    LOOP
      -- Create standard duration type name
      DECLARE
        duration_name TEXT;
        duration_desc TEXT;
      BEGIN
        IF service_record.duration_unit = 'hours' THEN
          duration_name := CASE 
            WHEN service_record.duration_value <= 6 THEN 'Express'
            WHEN service_record.duration_value <= 12 THEN 'Fast'
            ELSE 'Same Day'
          END;
          duration_desc := service_record.duration_value || ' jam';
        ELSE -- days
          duration_name := CASE 
            WHEN service_record.duration_value = 1 THEN 'Express'
            WHEN service_record.duration_value = 2 THEN 'Standard'
            ELSE 'Economy'
          END;
          duration_desc := service_record.duration_value || ' hari';
        END IF;
        
        -- Insert duration type (ignore if exists)
        INSERT INTO public.service_duration_types (
          store_id, 
          name, 
          description, 
          duration_value, 
          duration_unit,
          price_multiplier
        ) VALUES (
          store_record.id,
          duration_name,
          duration_desc,
          service_record.duration_value,
          service_record.duration_unit,
          CASE 
            WHEN duration_name = 'Express' THEN 1.5
            WHEN duration_name = 'Standard' THEN 1.0
            ELSE 0.8
          END
        ) ON CONFLICT (store_id, name) DO NOTHING;
        
        RAISE NOTICE 'Created/found duration type: % (% %)', duration_name, service_record.duration_value, service_record.duration_unit;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 8: Populate base prices from existing prices (copy current prices as base)
UPDATE public.services 
SET 
  base_unit_price = unit_price,
  base_kilo_price = kilo_price
WHERE base_unit_price IS NULL OR base_kilo_price IS NULL;

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.service_duration_types IS 'Duration types that can be applied to services with price multipliers';
COMMENT ON COLUMN public.service_duration_types.price_multiplier IS 'Multiplier applied to base service price (1.5 for express, 1.0 for standard, 0.8 for economy)';
COMMENT ON COLUMN public.services.base_unit_price IS 'Base price per unit before duration multiplier';
COMMENT ON COLUMN public.services.base_kilo_price IS 'Base price per kilo before duration multiplier';

-- Execute the migration function
SELECT migrate_services_to_duration_types();
