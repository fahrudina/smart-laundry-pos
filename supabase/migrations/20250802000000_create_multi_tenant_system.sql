-- Multi-Tenant Store System Migration
-- Create stores table and update existing tables with store associations

-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create indexes for stores
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX idx_stores_is_active ON public.stores(is_active);

-- Update users table to add store_id and update role enum
ALTER TABLE public.users ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create index for users store_id
CREATE INDEX idx_users_store_id ON public.users(store_id);

-- Update customers table to add store_id
ALTER TABLE public.customers ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Create index for customers store_id
CREATE INDEX idx_customers_store_id ON public.customers(store_id);

-- Update orders table to add store_id
ALTER TABLE public.orders ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Create index for orders store_id
CREATE INDEX idx_orders_store_id ON public.orders(store_id);

-- Drop existing RLS policies for multi-tenant updates
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for registration" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON public.order_items;

-- Create RLS policies for stores
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

-- Create RLS policies for users with store-level isolation
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

-- Create RLS policies for customers with store-level isolation
CREATE POLICY "Store staff can manage customers in their store" 
ON public.customers 
FOR ALL 
USING (
  store_id = (SELECT store_id FROM public.users WHERE id = auth.uid())
  OR
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

-- Create RLS policies for orders with store-level isolation
CREATE POLICY "Store staff can manage orders in their store" 
ON public.orders 
FOR ALL 
USING (
  store_id = (SELECT store_id FROM public.users WHERE id = auth.uid())
  OR
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

-- Create RLS policies for order_items with store-level isolation
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

-- Create function to automatically update store_id for new customers
CREATE OR REPLACE FUNCTION public.set_customer_store_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    NEW.store_id := (SELECT store_id FROM public.users WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically update store_id for new orders
CREATE OR REPLACE FUNCTION public.set_order_store_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    NEW.store_id := (SELECT store_id FROM public.users WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic store_id assignment
CREATE TRIGGER set_customer_store_id_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_store_id();

CREATE TRIGGER set_order_store_id_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_store_id();

-- Create function for store owners to create stores
CREATE OR REPLACE FUNCTION public.create_store(
  store_name TEXT,
  store_description TEXT DEFAULT NULL,
  store_address TEXT DEFAULT NULL,
  store_phone TEXT DEFAULT NULL,
  store_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_store_id UUID;
  current_user_role TEXT;
BEGIN
  -- Check if user has permission to create stores
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF current_user_role != 'laundry_owner' THEN
    RAISE EXCEPTION 'Only laundry owners can create stores';
  END IF;

  INSERT INTO public.stores (name, description, address, phone, email, owner_id)
  VALUES (
    store_name,
    store_description,
    store_address,
    store_phone,
    store_email,
    auth.uid()
  )
  RETURNING id INTO new_store_id;
  
  RETURN new_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for store owners to assign staff to stores
CREATE OR REPLACE FUNCTION public.assign_staff_to_store(
  staff_user_id UUID,
  target_store_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  store_owner_id UUID;
BEGIN
  -- Check if current user is a laundry owner
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF current_user_role != 'laundry_owner' THEN
    RAISE EXCEPTION 'Only laundry owners can assign staff to stores';
  END IF;

  -- Check if the store belongs to the current user
  SELECT owner_id INTO store_owner_id 
  FROM public.stores 
  WHERE id = target_store_id;
  
  IF store_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only assign staff to your own stores';
  END IF;

  -- Update the staff user's store assignment
  UPDATE public.users 
  SET store_id = target_store_id, updated_at = now()
  WHERE id = staff_user_id AND role = 'staff';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's accessible stores
CREATE OR REPLACE FUNCTION public.get_user_stores()
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  store_description TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  is_owner BOOLEAN,
  is_active BOOLEAN
) AS $$
DECLARE
  current_user_role TEXT;
  current_user_store_id UUID;
BEGIN
  SELECT role, store_id INTO current_user_role, current_user_store_id
  FROM public.users 
  WHERE id = auth.uid();
  
  IF current_user_role = 'laundry_owner' THEN
    -- Return all stores owned by this user
    RETURN QUERY
    SELECT 
      s.id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      true as is_owner,
      s.is_active
    FROM public.stores s
    WHERE s.owner_id = auth.uid()
    ORDER BY s.created_at DESC;
  ELSE
    -- Return only the store assigned to this staff member
    RETURN QUERY
    SELECT 
      s.id,
      s.name,
      s.description,
      s.address,
      s.phone,
      s.email,
      false as is_owner,
      s.is_active
    FROM public.stores s
    WHERE s.id = current_user_store_id
    AND s.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates on stores
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the create_user function to support laundry_owner role
CREATE OR REPLACE FUNCTION public.create_user(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'staff'
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validate role
  IF user_role NOT IN ('staff', 'laundry_owner') THEN
    RAISE EXCEPTION 'Invalid role. Must be either staff or laundry_owner';
  END IF;

  INSERT INTO public.users (email, password_hash, full_name, phone, role)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf', 12)),
    user_full_name,
    user_phone,
    user_role
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
