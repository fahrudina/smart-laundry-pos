# Points System - Quick Reference

## For Developers

### Points Earning Rules
```typescript
// Kilo-based services
if (service_type === 'kilo') {
  points = Math.round(weight_kg);  // 1 point per kg (rounded)
}

// Unit-based services
if (service_type === 'unit') {
  points = Math.ceil(quantity);  // 1 point per unit (rounded up)
}

// Combined services
if (service_type === 'combined') {
  points = Math.round(weight_kg) + Math.ceil(quantity);
}
```

### When Points Are Awarded
- ✅ Only when `payment_status === 'paid'`
- ✅ Automatically on order creation via `useCreateOrderWithNotifications`
- ✅ Per customer per store (isolated by `store_id`)

### Key Code Locations
```
Points awarding:        src/hooks/useOrdersWithNotifications.ts:66-145
WhatsApp template:      src/integrations/whatsapp/templates.ts:72-74
SQL function:           supabase/migrations/20251101000000_*.sql:58-92
Base tables:            supabase/migrations/20251031000000_*.sql
```

### Database Tables

**`points` table:**
```sql
point_id              SERIAL PRIMARY KEY
customer_phone        TEXT (links to customers)
store_id              UUID (multi-tenant)
accumulated_points    INTEGER (lifetime total)
current_points        INTEGER (available balance)
```

**`point_transactions` table:**
```sql
transaction_id        SERIAL PRIMARY KEY
point_id              INTEGER FK → points
order_id              UUID FK → orders
points_changed        INTEGER (+ for earn, - for redeem)
transaction_type      VARCHAR ('earning' | 'redemption')
transaction_date      TIMESTAMP
notes                 TEXT
```

### Quick SQL Queries

**Check customer points:**
```sql
SELECT customer_phone, current_points, accumulated_points
FROM points
WHERE customer_phone = '08123456789' AND store_id = 'store-uuid';
```

**Calculate points for an order:**
```sql
SELECT calculate_order_points('order-uuid-here');
```

**View transaction history:**
```sql
SELECT pt.*, p.customer_phone
FROM point_transactions pt
JOIN points p ON p.point_id = pt.point_id
WHERE p.customer_phone = '08123456789'
ORDER BY pt.transaction_date DESC;
```

**Top customers by points:**
```sql
SELECT customer_phone, accumulated_points, current_points
FROM points
WHERE store_id = 'store-uuid'
ORDER BY accumulated_points DESC
LIMIT 10;
```

## For Store Owners

### How It Works
1. Customer completes laundry order with payment
2. System automatically calculates points:
   - **1 point per kilogram** for weight-based services
   - **1 point per item** for unit-based services
3. Points are added to customer's balance
4. Customer receives WhatsApp notification with points earned
5. Points accumulate over time

### Example Scenarios

**Scenario 1: Weight-based (Kiloan)**
- Customer orders 2.3 kg of regular wash
- Points earned: `Math.round(2.3) = 2 points`

**Scenario 2: Unit-based (Satuan)**
- Customer orders 5 shirts
- Points earned: `5 points`

**Scenario 3: Combined**
- Customer orders 3.7 kg cuci + 2 shoes
- Points earned: `Math.round(3.7) + 2 = 6 points`

### Current Limitations
⚠️ **Points can be earned but not yet redeemed**
- UI for viewing points: Not implemented
- Point redemption: Not implemented
- Point expiration: Not configured
- Manual adjustments: No admin UI

### Checking Customer Points (Manual)

**Via Supabase Dashboard:**
1. Login to Supabase Dashboard
2. Go to Table Editor → `points` table
3. Filter by `customer_phone` or `store_id`
4. View `current_points` and `accumulated_points`

**Via SQL Editor:**
```sql
-- Replace with actual phone number
SELECT
  customer_phone,
  current_points as "Available Points",
  accumulated_points as "Total Earned",
  (accumulated_points - current_points) as "Total Redeemed",
  updated_at as "Last Updated"
FROM points
WHERE customer_phone = '08123456789'
  AND store_id = 'your-store-uuid';
```

## For Support/Troubleshooting

### Common Issues

**Issue: Customer says they didn't receive points**

1. **Check payment status:**
   ```sql
   SELECT id, payment_status, points_earned
   FROM orders
   WHERE customer_phone = '08123456789'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   Points only awarded when `payment_status = 'paid'`

2. **Check points table:**
   ```sql
   SELECT * FROM points
   WHERE customer_phone = '08123456789';
   ```

3. **Check transaction history:**
   ```sql
   SELECT pt.*, p.customer_phone
   FROM point_transactions pt
   JOIN points p ON p.point_id = pt.point_id
   WHERE p.customer_phone = '08123456789'
   ORDER BY transaction_date DESC;
   ```

**Issue: Points showing wrong amount**

1. **Recalculate using SQL function:**
   ```sql
   -- Get order ID from orders table first
   SELECT calculate_order_points('order-uuid');
   ```

2. **Compare with stored value:**
   ```sql
   SELECT id, points_earned, payment_status
   FROM orders
   WHERE id = 'order-uuid';
   ```

3. **Manual correction (if needed):**
   ```sql
   -- Update points in orders table
   UPDATE orders
   SET points_earned = calculate_order_points(id)
   WHERE id = 'order-uuid';

   -- Then manually adjust customer balance
   -- (Create transaction record for audit trail)
   ```

**Issue: Points not showing in WhatsApp**

1. **Check WhatsApp is enabled:**
   - Store settings → WhatsApp configuration
   - Verify API credentials are correct

2. **Check order had points:**
   ```sql
   SELECT points_earned FROM orders WHERE id = 'order-uuid';
   ```

3. **Check notification logs:**
   - Browser console (F12)
   - Look for "WhatsApp notification" logs
   - Errors will show if notification failed

**Issue: Duplicate points awarded**

- This shouldn't happen due to unique constraint
- Check for multiple order creations
- Review order history in database

### Manual Point Adjustment

If you need to manually adjust points (for customer service):

```sql
-- Step 1: Find customer's point_id
SELECT point_id, current_points, accumulated_points
FROM points
WHERE customer_phone = '08123456789' AND store_id = 'store-uuid';

-- Step 2: Add adjustment transaction
INSERT INTO point_transactions (
  point_id,
  points_changed,
  transaction_type,
  transaction_date,
  notes
) VALUES (
  123,  -- point_id from step 1
  10,   -- Points to add (negative to subtract)
  'earning',  -- or 'redemption'
  now(),
  'Manual adjustment: [reason here]'
);

-- Step 3: Update points balance
UPDATE points
SET
  current_points = current_points + 10,
  accumulated_points = accumulated_points + 10,  -- Only if earning
  updated_at = now()
WHERE point_id = 123;
```

## Migration Status Check

Run this to verify points system is installed:

```sql
-- Should return 2 tables
SELECT tablename FROM pg_tables
WHERE tablename IN ('points', 'point_transactions');

-- Should return 4+ columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'points';

-- Should return function name
SELECT proname FROM pg_proc
WHERE proname = 'calculate_order_points';
```

All queries should return results. If not, run deployment guide.

## Resources

- **Full Deployment:** `POINTS_DEPLOYMENT_GUIDE.md`
- **Implementation Details:** `LAUNDRY_POINTS_IMPLEMENTATION.md`
- **Architecture:** `CLAUDE.md` (Points System section)
- **Verification Script:** `script/verify-points-tables.sql`
- **Test Data:** `script/seed-test-points-data.sql`
