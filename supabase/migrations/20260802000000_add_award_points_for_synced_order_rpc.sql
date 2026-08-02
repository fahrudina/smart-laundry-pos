-- Atomic points-earning RPC, used by both the online order-creation path and
-- the offline sync worker. Replaces the previous client-driven
-- read-balance -> branch -> update/insert -> insert-transaction sequence,
-- which had an unguarded race: two concurrent completions for the same new
-- customer could both see "no existing points row" and both try to insert,
-- or double-credit an existing balance. Doing it as one plpgsql function
-- makes the whole sequence a single implicit transaction with an internal
-- compare-and-swap guard, so calling it twice for the same order (retry
-- after a dropped connection, two tabs syncing the same queued order) is a
-- safe no-op the second time rather than a double-credit.
CREATE OR REPLACE FUNCTION public.award_points_for_synced_order(
  p_order_id UUID,
  p_store_id UUID,
  p_customer_phone TEXT,
  p_points_earned INTEGER
)
RETURNS TABLE(awarded BOOLEAN, point_id INTEGER, current_points INTEGER) AS $$
DECLARE
  v_point_id INTEGER;
  v_current_points INTEGER;
BEGIN
  -- Compare-and-swap guard: only the first caller to reach here for this
  -- order (across retries, tabs, devices) gets past this UPDATE having
  -- actually matched a row.
  UPDATE public.orders
  SET points_earned = p_points_earned
  WHERE id = p_order_id
    AND (points_earned IS NULL OR points_earned = 0)
    AND p_points_earned > 0;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  INSERT INTO public.points (customer_phone, store_id, accumulated_points, current_points)
  VALUES (p_customer_phone, p_store_id, p_points_earned, p_points_earned)
  ON CONFLICT (customer_phone, store_id) DO UPDATE SET
    accumulated_points = public.points.accumulated_points + p_points_earned,
    current_points = public.points.current_points + p_points_earned,
    updated_at = now()
  RETURNING public.points.point_id, public.points.current_points INTO v_point_id, v_current_points;

  INSERT INTO public.point_transactions (point_id, order_id, points_changed, transaction_type, notes)
  VALUES (
    v_point_id,
    p_order_id,
    p_points_earned,
    'earning',
    'Points earned from order ' || substr(p_order_id::TEXT, 1, 8)
  );

  RETURN QUERY SELECT true, v_point_id, v_current_points;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.award_points_for_synced_order(UUID, UUID, TEXT, INTEGER) IS
  'Atomically awards points for a completed order. Safe to call more than once for the same order_id - the second call is a confirmed no-op via the points_earned guard on orders, not a double-credit.';
