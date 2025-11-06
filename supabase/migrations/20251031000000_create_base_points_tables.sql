-- Create base points tables for customer loyalty system
-- This migration creates the foundational tables that are enhanced by 20251101000000_create_customer_points_system.sql
-- IMPORTANT: This should be run before the enhancement migration

-- Create points table to track customer loyalty points
CREATE TABLE IF NOT EXISTS public.points (
  point_id SERIAL PRIMARY KEY,
  member_id INTEGER,  -- Legacy field, kept for backward compatibility
  accumulated_points INTEGER NOT NULL DEFAULT 0,  -- Total points earned over lifetime
  current_points INTEGER NOT NULL DEFAULT 0,      -- Available points after redemptions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create point_transactions table to track all point activity
CREATE TABLE IF NOT EXISTS public.point_transactions (
  transaction_id SERIAL PRIMARY KEY,
  point_id INTEGER NOT NULL REFERENCES public.points(point_id) ON DELETE CASCADE,
  receipt_id INTEGER,  -- Legacy field for external receipt system integration
  points_changed INTEGER NOT NULL,  -- Positive for earning, negative for redemption
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earning', 'redemption')),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,  -- Additional context about the transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_member_id ON public.points(member_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON public.points(created_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_point_id ON public.point_transactions(point_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_transaction_date ON public.point_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_point_transactions_transaction_type ON public.point_transactions(transaction_type);

-- Enable Row Level Security
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for now, will be enhanced by later migration)
CREATE POLICY IF NOT EXISTS "Allow all operations on points"
ON public.points
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on point_transactions"
ON public.point_transactions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_points_updated_at ON public.points;
CREATE TRIGGER update_points_updated_at
BEFORE UPDATE ON public.points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_point_transactions_updated_at ON public.point_transactions;
CREATE TRIGGER update_point_transactions_updated_at
BEFORE UPDATE ON public.point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.points IS 'Stores customer loyalty point balances. Enhanced by multi-tenant system.';
COMMENT ON COLUMN public.points.point_id IS 'Primary key for point records';
COMMENT ON COLUMN public.points.member_id IS 'Legacy member ID field, kept for backward compatibility';
COMMENT ON COLUMN public.points.accumulated_points IS 'Total points earned over customer lifetime (never decreases)';
COMMENT ON COLUMN public.points.current_points IS 'Currently available points (decreases on redemption)';

COMMENT ON TABLE public.point_transactions IS 'Tracks all point earning and redemption transactions';
COMMENT ON COLUMN public.point_transactions.transaction_id IS 'Primary key for transactions';
COMMENT ON COLUMN public.point_transactions.point_id IS 'Reference to points table';
COMMENT ON COLUMN public.point_transactions.receipt_id IS 'Legacy receipt ID for external system integration';
COMMENT ON COLUMN public.point_transactions.points_changed IS 'Points added (positive) or removed (negative)';
COMMENT ON COLUMN public.point_transactions.transaction_type IS 'Type of transaction: earning or redemption';
COMMENT ON COLUMN public.point_transactions.notes IS 'Additional context or description of transaction';
