-- Update get_receipt_data function to include order_number field
-- This allows the receipt to display human-readable order numbers

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
      'order_number', o.order_number,
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
          'weight_kg', oi.weight_kg,
          'unit_items', oi.unit_items,
          'estimated_completion', oi.estimated_completion
        )
      )
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  )
  INTO receipt_data
  FROM public.orders o
  LEFT JOIN public.stores s ON o.store_id = s.store_id
  WHERE o.id = order_id_param;

  -- Return the result
  RETURN receipt_data;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.get_receipt_data(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_receipt_data(UUID) TO authenticated;

-- Update function documentation
COMMENT ON FUNCTION public.get_receipt_data(UUID) IS 'Public function to retrieve complete receipt data including order_number for a given order ID. Accessible without authentication for receipt viewing.';