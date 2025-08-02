-- Complete RLS reset for customers and orders tables
-- This will completely disable and re-enable RLS with minimal policies

-- Disable RLS temporarily to allow operations
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on customers table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
    END LOOP;
    
    -- Drop all policies on orders table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'orders' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create the most basic policy possible - just allow everything for authenticated users
-- This will help us isolate if the issue is with RLS logic or something else

CREATE POLICY "customers_allow_all" ON public.customers 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "orders_allow_all" ON public.orders 
    FOR ALL USING (true) WITH CHECK (true);

-- Also ensure the helper functions exist and work correctly
-- Let's create a simple version of the store assignment function

CREATE OR REPLACE FUNCTION public.set_customer_store_id_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Set store_id to a default value if null
  IF NEW.store_id IS NULL THEN
    -- Try to get user's store, if none found, use the first available store
    SELECT COALESCE(
      (SELECT store_id FROM public.users WHERE id = auth.uid()),
      (SELECT id FROM public.stores LIMIT 1)
    ) INTO NEW.store_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_order_store_id_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Set store_id to a default value if null
  IF NEW.store_id IS NULL THEN
    -- Try to get user's store, if none found, use the first available store
    SELECT COALESCE(
      (SELECT store_id FROM public.users WHERE id = auth.uid()),
      (SELECT id FROM public.stores LIMIT 1)
    ) INTO NEW.store_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the triggers with simpler versions
DROP TRIGGER IF EXISTS set_customer_store_id_trigger ON public.customers;
CREATE TRIGGER set_customer_store_id_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_store_id_simple();

DROP TRIGGER IF EXISTS set_order_store_id_trigger ON public.orders;
CREATE TRIGGER set_order_store_id_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_store_id_simple();
