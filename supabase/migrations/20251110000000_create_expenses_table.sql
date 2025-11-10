-- Create expenses table for tracking business deductions
-- This table stores operational expenses like detergent, gas, electricity tokens, promotions, etc.

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('detergent', 'gas', 'electricity', 'promo', 'maintenance', 'other')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (can be restricted later with auth)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Allow all operations on expenses') THEN
    CREATE POLICY "Allow all operations on expenses" 
    ON public.expenses 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON public.expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Create trigger for expenses table
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at 
BEFORE UPDATE ON public.expenses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.expenses IS 'Stores operational expenses for calculating net profit';
COMMENT ON COLUMN public.expenses.category IS 'Expense category: detergent, gas, electricity, promo, maintenance, other';
COMMENT ON COLUMN public.expenses.expense_date IS 'Date when the expense occurred';
COMMENT ON COLUMN public.expenses.amount IS 'Expense amount in local currency';
