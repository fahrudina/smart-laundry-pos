-- Implement proper multi-tenant RLS policies
-- This replaces the "allow all" policies with proper store-based filtering

-- First, ensure the helper functions work correctly for current user context
CREATE OR REPLACE FUNCTION public.get_current_user_store_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT store_id 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1
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

-- Replace the "allow all" policies with proper multi-tenant policies

-- CUSTOMERS TABLE
DROP POLICY IF EXISTS "customers_allow_all" ON public.customers;

-- Staff can only see customers from their assigned store
-- Owners can see customers from all their owned stores
CREATE POLICY "customers_store_access" ON public.customers
FOR SELECT USING (
  -- Staff access: customer belongs to their assigned store
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  -- Owner access: customer belongs to any of their owned stores
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

-- Allow INSERT for customers (store_id will be set by trigger)
CREATE POLICY "customers_insert_access" ON public.customers
FOR INSERT WITH CHECK (
  -- Allow if user is authenticated and store_id will be set correctly by trigger
  auth.uid() IS NOT NULL
  AND (
    -- For staff: ensure the store_id matches their assigned store (or is null and will be set by trigger)
    (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
      AND (
        store_id = public.get_current_user_store_id()
        OR store_id IS NULL
      )
    )
    OR
    -- For owners: ensure the store_id is one of their owned stores (or is null and will be set by trigger)
    (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
      AND (
        store_id = ANY(public.get_user_owned_store_ids())
        OR store_id IS NULL
      )
    )
  )
);

-- Allow UPDATE for customers in their store context
CREATE POLICY "customers_update_access" ON public.customers
FOR UPDATE USING (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
) WITH CHECK (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

-- Allow DELETE for customers in their store context
CREATE POLICY "customers_delete_access" ON public.customers
FOR DELETE USING (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

-- ORDERS TABLE
DROP POLICY IF EXISTS "orders_allow_all" ON public.orders;

CREATE POLICY "orders_store_access" ON public.orders
FOR SELECT USING (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

CREATE POLICY "orders_insert_access" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
      AND (
        store_id = public.get_current_user_store_id()
        OR store_id IS NULL
      )
    )
    OR
    (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
      AND (
        store_id = ANY(public.get_user_owned_store_ids())
        OR store_id IS NULL
      )
    )
  )
);

CREATE POLICY "orders_update_access" ON public.orders
FOR UPDATE USING (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
) WITH CHECK (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

CREATE POLICY "orders_delete_access" ON public.orders
FOR DELETE USING (
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND store_id = public.get_current_user_store_id()
  )
  OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
    AND store_id = ANY(public.get_user_owned_store_ids())
  )
);

-- ORDER_ITEMS TABLE
DROP POLICY IF EXISTS "order_items_allow_all" ON public.order_items;

CREATE POLICY "order_items_store_access" ON public.order_items
FOR SELECT USING (
  -- Check if the order belongs to user's accessible stores
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
        AND o.store_id = public.get_current_user_store_id()
      )
      OR
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
        AND o.store_id = ANY(public.get_user_owned_store_ids())
      )
    )
  )
);

CREATE POLICY "order_items_insert_access" ON public.order_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
        AND o.store_id = public.get_current_user_store_id()
      )
      OR
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
        AND o.store_id = ANY(public.get_user_owned_store_ids())
      )
    )
  )
);

CREATE POLICY "order_items_update_access" ON public.order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
        AND o.store_id = public.get_current_user_store_id()
      )
      OR
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
        AND o.store_id = ANY(public.get_user_owned_store_ids())
      )
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
        AND o.store_id = public.get_current_user_store_id()
      )
      OR
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
        AND o.store_id = ANY(public.get_user_owned_store_ids())
      )
    )
  )
);

CREATE POLICY "order_items_delete_access" ON public.order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
        AND o.store_id = public.get_current_user_store_id()
      )
      OR
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'laundry_owner'
        AND o.store_id = ANY(public.get_user_owned_store_ids())
      )
    )
  )
);
