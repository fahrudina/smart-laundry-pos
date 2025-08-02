-- Fix INSERT permissions for customers and orders tables
-- This addresses the "new row violates row-level security policy" error

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Store staff can insert customers in their store" ON public.customers;
DROP POLICY IF EXISTS "Store staff can insert orders in their store" ON public.orders;

-- Create more permissive INSERT policies for customers
CREATE POLICY "Allow customer insertion with store context" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  -- Allow if user has a store_id and the customer's store_id matches or is null
  (
    public.get_current_user_store_id() IS NOT NULL 
    AND (
      store_id = public.get_current_user_store_id()
      OR store_id IS NULL
    )
  )
  OR
  -- Allow if user owns stores and customer's store_id is one of them or null
  (
    array_length(public.get_user_owned_store_ids(), 1) > 0
    AND (
      store_id = ANY(public.get_user_owned_store_ids())
      OR store_id IS NULL
    )
  )
);

-- Create more permissive INSERT policies for orders
CREATE POLICY "Allow order insertion with store context" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Allow if user has a store_id and the order's store_id matches or is null
  (
    public.get_current_user_store_id() IS NOT NULL 
    AND (
      store_id = public.get_current_user_store_id()
      OR store_id IS NULL
    )
  )
  OR
  -- Allow if user owns stores and order's store_id is one of them or null
  (
    array_length(public.get_user_owned_store_ids(), 1) > 0
    AND (
      store_id = ANY(public.get_user_owned_store_ids())
      OR store_id IS NULL
    )
  )
);

-- Also ensure that the trigger functions for auto-assigning store_id are working
-- Let's recreate them to make sure they're properly set up

-- Recreate the customer store assignment trigger function
CREATE OR REPLACE FUNCTION public.set_customer_store_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set store_id if it's not already set
  IF NEW.store_id IS NULL THEN
    -- First try to get the user's assigned store_id
    NEW.store_id := public.get_current_user_store_id();
    
    -- If that's null, try to get the first owned store
    IF NEW.store_id IS NULL THEN
      SELECT id INTO NEW.store_id 
      FROM public.stores 
      WHERE owner_id = auth.uid() 
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the order store assignment trigger function
CREATE OR REPLACE FUNCTION public.set_order_store_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set store_id if it's not already set
  IF NEW.store_id IS NULL THEN
    -- First try to get the user's assigned store_id
    NEW.store_id := public.get_current_user_store_id();
    
    -- If that's null, try to get the first owned store
    IF NEW.store_id IS NULL THEN
      SELECT id INTO NEW.store_id 
      FROM public.stores 
      WHERE owner_id = auth.uid() 
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the triggers are properly set up
DROP TRIGGER IF EXISTS set_customer_store_id_trigger ON public.customers;
CREATE TRIGGER set_customer_store_id_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_store_id();

DROP TRIGGER IF EXISTS set_order_store_id_trigger ON public.orders;
CREATE TRIGGER set_order_store_id_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_store_id();
