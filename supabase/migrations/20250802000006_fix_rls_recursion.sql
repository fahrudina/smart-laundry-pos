-- Fix infinite recursion in RLS policies
-- Replace table references in policies with security definer functions

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Store owners can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Staff can view their assigned store" ON public.stores;
DROP POLICY IF EXISTS "Laundry owners can view staff in their stores" ON public.users;
DROP POLICY IF EXISTS "Laundry owners can update their staff" ON public.users;
DROP POLICY IF EXISTS "Store staff can manage customers in their store" ON public.customers;
DROP POLICY IF EXISTS "Store staff can manage orders in their store" ON public.orders;
DROP POLICY IF EXISTS "Store staff can manage order items in their store" ON public.order_items;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_store_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT store_id 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_owned_store_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT id 
    FROM public.stores 
    WHERE owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified RLS policies using the functions

-- Stores policies
CREATE POLICY "Store owners can manage their stores" 
ON public.stores 
FOR ALL 
USING (
  owner_id = auth.uid() 
  OR 
  public.get_current_user_role() = 'laundry_owner'
);

CREATE POLICY "Staff can view their assigned store" 
ON public.stores 
FOR SELECT 
USING (id = public.get_current_user_store_id());

-- Users policies (keep the safe ones)
CREATE POLICY "Laundry owners can view staff in their stores" 
ON public.users 
FOR SELECT 
USING (
  (public.get_current_user_role() = 'laundry_owner' AND id = auth.uid())
  OR 
  (store_id = ANY(public.get_user_owned_store_ids()))
);

CREATE POLICY "Laundry owners can update their staff" 
ON public.users 
FOR UPDATE 
USING (store_id = ANY(public.get_user_owned_store_ids()));

-- Customers policies
CREATE POLICY "Store staff can manage customers in their store" 
ON public.customers 
FOR ALL 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

-- Orders policies
CREATE POLICY "Store staff can manage orders in their store" 
ON public.orders 
FOR ALL 
USING (
  store_id = public.get_current_user_store_id()
  OR
  store_id = ANY(public.get_user_owned_store_ids())
);

-- Order items policies
CREATE POLICY "Store staff can manage order items in their store" 
ON public.order_items 
FOR ALL 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE store_id = public.get_current_user_store_id()
    OR store_id = ANY(public.get_user_owned_store_ids())
  )
);
