-- Fix RLS policies for INSERT operations
-- The issue is that we need separate USING and WITH CHECK clauses for different operations

-- Drop and recreate the customers policy with proper INSERT support
DROP POLICY IF EXISTS "Store staff can manage customers in their store" ON public.customers;

-- Create separate policies for different operations on customers
CREATE POLICY "Store staff can view customers in their store" 
ON public.customers 
FOR SELECT 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

CREATE POLICY "Store staff can insert customers in their store" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  -- Allow insert if store_id matches user's store or if store_id is null (will be set by trigger)
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
  OR
  store_id IS NULL
);

CREATE POLICY "Store staff can update customers in their store" 
ON public.customers 
FOR UPDATE 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
)
WITH CHECK (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

CREATE POLICY "Store staff can delete customers in their store" 
ON public.customers 
FOR DELETE 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

-- Apply the same fix to orders table
DROP POLICY IF EXISTS "Store staff can manage orders in their store" ON public.orders;

CREATE POLICY "Store staff can view orders in their store" 
ON public.orders 
FOR SELECT 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

CREATE POLICY "Store staff can insert orders in their store" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Allow insert if store_id matches user's store or if store_id is null (will be set by trigger)
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
  OR
  store_id IS NULL
);

CREATE POLICY "Store staff can update orders in their store" 
ON public.orders 
FOR UPDATE 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
)
WITH CHECK (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

CREATE POLICY "Store staff can delete orders in their store" 
ON public.orders 
FOR DELETE 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);
