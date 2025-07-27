-- Add indexes for better query performance
-- This will significantly improve the speed of order queries

-- Enable the pg_trgm extension for better text search (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for ordering by created_at (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);

-- Index for ordering by created_at and id (for consistent pagination)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_id_desc ON orders (created_at DESC, id DESC);

-- Indexes for filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_execution_status ON orders (execution_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders (payment_method);

-- Index for customer phone lookup
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);

-- Index for order items foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Composite index for common filtering scenarios
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (execution_status, payment_status, created_at DESC);

-- Index for text search on customer name (using trigram similarity)
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON orders USING gin (customer_name gin_trgm_ops);

-- Index for text search on customer phone (using trigram similarity)
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_trgm ON orders USING gin (customer_phone gin_trgm_ops);
