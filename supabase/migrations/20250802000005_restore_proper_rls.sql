-- Restore proper RLS policies for multi-tenant security
-- This migration restores the store-level isolation that was disabled for testing

-- Drop the permissive testing policies
DROP POLICY IF EXISTS "Allow all operations on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON public.order_items;

-- Restore proper RLS policies for stores
CREATE POLICY "Store owners can manage their stores" 
ON public.stores 
FOR ALL 
USING (owner_id = (SELECT id FROM public.users WHERE id = auth.uid()) 
       OR 
       (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner');

CREATE POLICY "Staff can view their assigned store" 
ON public.stores 
FOR SELECT 
USING (id = (SELECT store_id FROM public.users WHERE id = auth.uid()));

-- Restore proper RLS policies for users with store-level isolation
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Laundry owners can view staff in their stores" 
ON public.users 
FOR SELECT 
USING (
  role = 'laundry_owner' AND id = auth.uid()
  OR 
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

CREATE POLICY "Allow user registration" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Laundry owners can update their staff" 
ON public.users 
FOR UPDATE 
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Restore proper RLS policies for customers with store-level isolation
CREATE POLICY "Store staff can manage customers in their store" 
ON public.customers 
FOR ALL 
USING (
  store_id = (SELECT store_id FROM public.users WHERE id = auth.uid())
  OR
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

-- Restore proper RLS policies for orders with store-level isolation
CREATE POLICY "Store staff can manage orders in their store" 
ON public.orders 
FOR ALL 
USING (
  store_id = (SELECT store_id FROM public.users WHERE id = auth.uid())
  OR
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

-- Restore proper RLS policies for order_items with store-level isolation
CREATE POLICY "Store staff can manage order items in their store" 
ON public.order_items 
FOR ALL 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE store_id = (SELECT store_id FROM public.users WHERE id = auth.uid())
    OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  )
);
