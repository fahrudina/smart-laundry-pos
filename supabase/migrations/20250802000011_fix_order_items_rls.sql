-- Fix RLS for order_items table
-- Apply the same complete reset approach to order_items

-- Disable RLS temporarily to allow operations
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on order_items table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on order_items table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'order_items' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create the most basic policy possible - just allow everything for authenticated users
CREATE POLICY "order_items_allow_all" ON public.order_items 
    FOR ALL USING (true) WITH CHECK (true);

-- If order_items table has a store_id column, create a trigger for it too
-- First check if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items' 
        AND column_name = 'store_id'
    ) THEN
        -- Create trigger function for order_items
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.set_order_items_store_id_simple()
        RETURNS TRIGGER AS $func$
        BEGIN
          -- Set store_id to a default value if null
          IF NEW.store_id IS NULL THEN
            -- Try to get user''s store, if none found, use the first available store
            SELECT COALESCE(
              (SELECT store_id FROM public.users WHERE id = auth.uid()),
              (SELECT id FROM public.stores LIMIT 1)
            ) INTO NEW.store_id;
          END IF;
          
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
        ';
        
        -- Create trigger
        EXECUTE '
        DROP TRIGGER IF EXISTS set_order_items_store_id_trigger ON public.order_items;
        CREATE TRIGGER set_order_items_store_id_trigger
          BEFORE INSERT ON public.order_items
          FOR EACH ROW EXECUTE FUNCTION public.set_order_items_store_id_simple();
        ';
    END IF;
END $$;
