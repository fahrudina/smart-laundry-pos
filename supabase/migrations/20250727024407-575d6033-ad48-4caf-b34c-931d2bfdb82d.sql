-- Create customers table for the laundry POS system
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (for future authentication if needed)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (can be restricted later with auth)
CREATE POLICY "Allow all operations on customers" 
ON public.customers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for faster phone number searches
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- Create index for faster name searches
CREATE INDEX idx_customers_name ON public.customers USING gin(to_tsvector('english', name));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();