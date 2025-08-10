-- Add enable_qr column to stores table
-- This migration adds the enable_qr column to control QR code display on receipts

-- Add enable_qr column to stores table with default value false
ALTER TABLE public.stores ADD COLUMN enable_qr BOOLEAN NOT NULL DEFAULT false;

-- Create index for enable_qr for better query performance
CREATE INDEX idx_stores_enable_qr ON public.stores(enable_qr);

-- Add comment for documentation
COMMENT ON COLUMN public.stores.enable_qr IS 'Controls whether QR code is displayed on receipts for this store';

-- Update the get_receipt_data function to include enable_qr
CREATE OR REPLACE FUNCTION public.get_receipt_data(order_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
DECLARE
  receipt_data JSON;
BEGIN
  -- Get complete order information with store and order items
  SELECT json_build_object(
    'order', json_build_object(
      'id', o.id,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'subtotal', o.subtotal,
      'tax_amount', o.tax_amount,
      'total_amount', o.total_amount,
      'execution_status', o.execution_status,
      'payment_status', o.payment_status,
      'payment_method', o.payment_method,
      'cash_received', o.cash_received,
      'order_date', o.order_date,
      'estimated_completion', o.estimated_completion,
      'created_at', o.created_at,
      'updated_at', o.updated_at
    ),
    'store', json_build_object(
      'name', s.name,
      'address', s.address,
      'phone', s.phone,
      'enable_qr', s.enable_qr
    ),
    'order_items', (
      SELECT json_agg(
        json_build_object(
          'service_name', oi.service_name,
          'service_price', oi.service_price,
          'quantity', oi.quantity,
          'line_total', oi.line_total,
          'service_type', oi.service_type,
          'weight_kg', oi.weight_kg
        )
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  )
  INTO receipt_data
  FROM orders o
  JOIN stores s ON o.store_id = s.id
  WHERE o.id = order_id_param;

  -- Return null if order not found
  IF receipt_data IS NULL THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  RETURN receipt_data;
END;
$$;
