-- Update get_receipt_data function to include discount_amount and points_redeemed fields
-- This allows receipts to properly display discount information when customers redeem points

CREATE OR REPLACE FUNCTION public.get_receipt_data(order_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
      'discount_amount', COALESCE(o.discount_amount, 0),
      'points_redeemed', COALESCE(o.points_redeemed, 0),
      'execution_status', o.execution_status,
      'payment_status', o.payment_status,
      'payment_method', o.payment_method,
      'cash_received', o.cash_received,
      'points_earned', o.points_earned,
      'order_date', o.order_date,
      'estimated_completion', o.estimated_completion,
      'created_at', o.created_at,
      'updated_at', o.updated_at
    ),
    'store', json_build_object(
      'name', s.name,
      'address', s.address,
      'phone', s.phone,
      'enable_qr', s.enable_qr,
      'enable_points', s.enable_points
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
          'category', oi.category,
          'item_type', COALESCE(oi.item_type, 'service')
        )
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  )
  INTO receipt_data
  FROM orders o
  LEFT JOIN stores s ON o.store_id = s.id
  WHERE o.id = order_id_param;

  -- Return the receipt data or null if order not found
  RETURN receipt_data;
END;
$$;

-- Update comment for documentation
COMMENT ON FUNCTION public.get_receipt_data(UUID) IS 'Public function to retrieve complete receipt data including discount_amount and points_redeemed for displaying point redemption discounts. Accessible without authentication for receipt viewing.';
