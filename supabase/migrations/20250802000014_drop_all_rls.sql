-- Complete removal of all RLS policies and RLS settings
-- This will disable all Row Level Security across the database

-- Disable RLS on all main tables
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stores DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on all tables using dynamic SQL
DO $$ 
DECLARE
    pol RECORD;
    tbl RECORD;
BEGIN
    -- Loop through all tables in public schema that have policies
    FOR tbl IN 
        SELECT DISTINCT schemaname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        -- Drop all policies for each table
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl.tablename AND schemaname = tbl.schemaname
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, tbl.schemaname, tbl.tablename);
        END LOOP;
        
        -- Also disable RLS on the table
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
    END LOOP;
END $$;

-- Additional cleanup: Find any other tables with RLS enabled and disable them
DO $$
DECLARE
    tbl RECORD;
BEGIN
    -- Find all tables with RLS enabled in public schema
    FOR tbl IN 
        SELECT n.nspname as schemaname, c.relname as tablename
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r'  -- regular tables only
        AND c.relrowsecurity = true  -- RLS is enabled
    LOOP
        -- Disable RLS
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
        RAISE NOTICE 'Disabled RLS on table: %.%', tbl.schemaname, tbl.tablename;
    END LOOP;
END $$;

-- Drop any remaining policy-related functions if they exist
DROP FUNCTION IF EXISTS public.get_current_user_store_id();
DROP FUNCTION IF EXISTS public.get_user_owned_store_ids();

-- Drop trigger functions that were created for RLS support
DROP FUNCTION IF EXISTS public.set_customer_store_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_order_store_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_customer_store_id_simple() CASCADE;
DROP FUNCTION IF EXISTS public.set_order_store_id_simple() CASCADE;
DROP FUNCTION IF EXISTS public.set_order_items_store_id_simple() CASCADE;

-- This will automatically drop the associated triggers due to CASCADE
