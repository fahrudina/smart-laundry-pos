# Points System Deployment Guide

## Overview
This guide walks you through deploying the customer loyalty points system to your Supabase database.

## Prerequisites
- Access to Supabase SQL Editor
- Database backup (recommended)
- Understanding of your current database schema

## Deployment Steps

### Step 1: Verify Current State

Run the verification script to check if points tables already exist:

```bash
# Copy the contents of script/verify-points-tables.sql
# Paste into Supabase SQL Editor
# Execute and review results
```

**Expected outcomes:**
- ❌ Tables don't exist → Proceed with Step 2
- ✅ Tables exist but missing columns → Skip to Step 3
- ✅ Tables exist with all columns → System already deployed

### Step 2: Create Base Tables (If Missing)

**Migration file:** `supabase/migrations/20251031000000_create_base_points_tables.sql`

This creates:
- `points` table (customer point balances)
- `point_transactions` table (transaction history)
- Basic indexes and RLS policies
- Automatic timestamp triggers

**To apply:**

1. **Option A: Via Supabase Dashboard**
   - Navigate to SQL Editor
   - Copy contents of migration file
   - Execute the SQL
   - Verify no errors

2. **Option B: Via Supabase CLI** (if configured)
   ```bash
   supabase db push
   ```

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('points', 'point_transactions');
```
Should return 2 rows.

### Step 3: Apply Enhancement Migration

**Migration file:** `supabase/migrations/20251101000000_create_customer_points_system.sql`

This adds:
- `customer_phone` column to `points` (links to orders)
- `store_id` column to `points` (multi-tenant support)
- `order_id` column to `point_transactions` (order linkage)
- `points_earned` column to `orders` (caching)
- `calculate_order_points()` SQL function
- Updated RLS policies
- Performance indexes

**To apply:**
Same options as Step 2 (Dashboard or CLI)

**Verification:**
```sql
-- Check new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'points'
AND column_name IN ('customer_phone', 'store_id');

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'calculate_order_points';
```

### Step 4: Verify Complete Setup

Run the full verification script again:
```bash
script/verify-points-tables.sql
```

All checks should show ✅ (green checkmarks).

### Step 5: Test Points Calculation

Create a test order and verify points are awarded:

```sql
-- 1. Create a test customer (if not exists)
INSERT INTO customers (name, phone, store_id)
VALUES ('Test Customer', '08123456789', 'your-store-uuid-here')
ON CONFLICT (phone, store_id) DO NOTHING;

-- 2. Create a test order with payment_status = 'paid'
-- (Use your POS interface for this)

-- 3. Verify points were awarded
SELECT
  p.customer_phone,
  p.accumulated_points,
  p.current_points,
  o.id as order_id,
  o.points_earned
FROM points p
JOIN orders o ON o.customer_phone = p.customer_phone
WHERE p.customer_phone = '08123456789'
ORDER BY o.created_at DESC
LIMIT 5;

-- 4. Check transaction history
SELECT
  pt.transaction_type,
  pt.points_changed,
  pt.transaction_date,
  pt.notes,
  pt.order_id
FROM point_transactions pt
JOIN points p ON p.point_id = pt.point_id
WHERE p.customer_phone = '08123456789'
ORDER BY pt.transaction_date DESC;
```

## Validation Checklist

Before considering deployment complete, verify:

- [ ] Both tables exist (`points`, `point_transactions`)
- [ ] All required columns are present
- [ ] `calculate_order_points()` function exists
- [ ] RLS policies are active
- [ ] Indexes are created
- [ ] Test order awards points correctly
- [ ] Points appear in `points` table
- [ ] Transaction recorded in `point_transactions`
- [ ] WhatsApp notification includes points (if enabled)

## Common Issues

### Issue 1: Tables Already Exist
**Symptom:** `ERROR: relation "points" already exists`

**Solution:**
- Tables were created manually or via external tool
- Skip Step 2, proceed to Step 3
- Verify existing structure matches expected schema

### Issue 2: Missing store_id Reference
**Symptom:** `ERROR: column "store_id" does not exist`

**Solution:**
- Your `stores` table might not exist
- Check multi-tenant setup is complete
- Verify migration `20250802000000_create_multi_tenant_system.sql` was applied

### Issue 3: Points Not Awarded
**Symptom:** Orders created but `points` table empty

**Causes & Solutions:**

1. **Payment status not 'paid':**
   - Points only awarded when `payment_status = 'paid'`
   - Check order status in database

2. **Hook not being used:**
   - Verify POS uses `useCreateOrderWithNotifications` hook
   - Check `src/hooks/useOrdersWithNotifications.ts:66-145`

3. **Silent errors:**
   - Check browser console for errors
   - Add try/catch logging to point awarding code

4. **Store context issue:**
   - Verify `currentStore?.store_id` is set
   - Check user is logged in and has store access

### Issue 4: Duplicate Key Error
**Symptom:** `ERROR: duplicate key value violates unique constraint "points_customer_phone_store_id_key"`

**Solution:**
- This is expected behavior (one point record per customer per store)
- Points should be updated, not inserted again
- Check code is using UPSERT pattern or checking for existing records

## Rollback Instructions

If you need to remove the points system:

**WARNING: This will permanently delete all points data!**

1. **Backup first:**
   ```sql
   -- In Supabase SQL Editor, export results to CSV:
   SELECT * FROM points;
   SELECT * FROM point_transactions;
   ```

2. **Run rollback migration:**
   ```bash
   # Copy contents of supabase/migrations/ROLLBACK_20251031000000_create_base_points_tables.sql
   # Execute in Supabase SQL Editor
   ```

3. **Clean up enhancement columns:**
   ```sql
   ALTER TABLE orders DROP COLUMN IF EXISTS points_earned;
   -- Other cleanup as needed
   ```

## Monitoring

After deployment, monitor:

### Daily Checks
- Points awarded per day: `SELECT COUNT(*), SUM(points_changed) FROM point_transactions WHERE transaction_date >= CURRENT_DATE`
- Failed point awards: Check application logs for errors
- Customer feedback: Are customers seeing points in notifications?

### Weekly Checks
- Total points issued: `SELECT SUM(accumulated_points) FROM points`
- Top customers by points: `SELECT customer_phone, accumulated_points FROM points ORDER BY accumulated_points DESC LIMIT 10`
- Orphaned records: Run verification script

## Next Steps

After successful deployment:

1. **Add UI for point display** (See recommendation #4 in review)
2. **Implement point redemption** (See recommendation #7 in review)
3. **Add error handling** (See recommendation #2 in review)
4. **Monitor usage and customer feedback**

## Support

If you encounter issues:

1. Check browser console for errors
2. Review Supabase logs in Dashboard → Logs
3. Run verification script: `script/verify-points-tables.sql`
4. Check application logs for point awarding errors
5. Verify feature works end-to-end with test customer

## Resources

- **Migration Files:**
  - Base tables: `supabase/migrations/20251031000000_create_base_points_tables.sql`
  - Enhancements: `supabase/migrations/20251101000000_create_customer_points_system.sql`

- **Documentation:**
  - Implementation details: `LAUNDRY_POINTS_IMPLEMENTATION.md`
  - Architecture guide: `CLAUDE.md` (Points System section)

- **Code:**
  - Point awarding logic: `src/hooks/useOrdersWithNotifications.ts:66-145`
  - WhatsApp template: `src/integrations/whatsapp/templates.ts:72-74`
  - SQL function: `calculate_order_points()` in enhancement migration
