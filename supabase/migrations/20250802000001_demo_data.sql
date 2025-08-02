-- Demo data setup for multi-tenant system
-- Run this after the main migration to set up demo stores and users

-- Create a demo laundry owner
INSERT INTO public.users (id, email, password_hash, full_name, phone, role, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'owner@example.com',
  crypt('password123', gen_salt('bf', 12)),
  'John Smith',
  '+1234567890',
  'laundry_owner',
  true
) ON CONFLICT (email) DO NOTHING;

-- Create demo stores
INSERT INTO public.stores (id, name, description, address, phone, email, owner_id, is_active)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    'Downtown Laundry',
    'Full-service laundry in the heart of downtown',
    '123 Main St, Downtown, City 12345',
    '+1234567891',
    'downtown@laundrychains.com',
    '00000000-0000-0000-0000-000000000001',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Suburban Clean',
    'Family-friendly laundry service in the suburbs',
    '456 Oak Ave, Suburbs, City 12346',
    '+1234567892',
    'suburban@laundrychains.com',
    '00000000-0000-0000-0000-000000000001',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create demo staff members
INSERT INTO public.users (id, email, password_hash, full_name, phone, role, store_id, is_active) 
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'staff1@example.com',
    crypt('password123', gen_salt('bf', 12)),
    'Alice Johnson',
    '+1234567893',
    'staff',
    '10000000-0000-0000-0000-000000000001',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'staff2@example.com',
    crypt('password123', gen_salt('bf', 12)),
    'Bob Wilson',
    '+1234567894',
    'staff',
    '10000000-0000-0000-0000-000000000002',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- Create demo customers for each store
INSERT INTO public.customers (id, name, phone, email, address, store_id)
VALUES 
  -- Downtown Laundry customers
  (
    '20000000-0000-0000-0000-000000000001',
    'Emily Davis',
    '+1555000001',
    'emily.davis@email.com',
    '789 City Blvd, Downtown, City 12345',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Michael Brown',
    '+1555000002',
    'michael.brown@email.com',
    '321 Business St, Downtown, City 12345',
    '10000000-0000-0000-0000-000000000001'
  ),
  -- Suburban Clean customers
  (
    '20000000-0000-0000-0000-000000000003',
    'Sarah Miller',
    '+1555000003',
    'sarah.miller@email.com',
    '654 Family Lane, Suburbs, City 12346',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'David Jones',
    '+1555000004',
    'david.jones@email.com',
    '987 Quiet St, Suburbs, City 12346',
    '10000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (phone) DO NOTHING;
