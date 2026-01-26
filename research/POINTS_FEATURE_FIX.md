# Loyalty Points Feature Fix

## Problem Summary

The loyalty points feature was not working because the `get_user_stores()` database function was missing the `enable_points` and `enable_qr` fields in its return data.

## Root Cause

1. **Database Function Issue**: The `get_user_stores()` RPC function (defined in `supabase/migrations/20250802000004_fix_ambiguous_column.sql`) was not returning the `enable_points` column from the stores table.

2. **Impact**:
   - StoreContext's `currentStore` object didn't have the `enable_points` field
   - Points calculation logic checked `currentStore?.enable_points` but it was always `undefined`
   - Points were never awarded to customers
   - All points-related UI components were hidden (they check for `enable_points` and return null if disabled)

## The Fix

Created migration: `20251107000000_fix_get_user_stores_add_enable_points.sql`

This migration:
- Drops and recreates the `get_user_stores()` function
- Adds `enable_qr` and `enable_points` to the RETURNS TABLE definition
- Includes these fields in both SELECT statements (for owners and staff)
- Uses `COALESCE(s.enable_points, false)` to default to false if null

## How to Apply the Fix

### Step 1: Run the Migration in Supabase

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql`
3. Paste and run the SQL
4. You should see a success message confirming the migration

### Step 2: Enable Points for Your Store

1. Log in to your POS system as a store owner
2. Navigate to **Store Management** → **Store Settings**
3. Toggle **"Enable Points Rewards"** to ON
4. Click **Save Settings**

### Step 3: Verify the Fix

1. **Test Points Awarding**:
   - Create a new order with payment status = "paid"
   - After the order is created, check the customer's points in the Customers page
   - You should see points awarded (1 point per kg for kilo services, 1 point per unit for unit services)

2. **Test UI Components**:
   - Go to **Customers** page
   - Click on a customer who has completed paid orders
   - You should see the **"Poin Loyalitas"** (Loyalty Points) card displaying their points
   - The customer points badge should appear in the customer list

3. **Test Receipts**:
   - View a receipt for a paid order
   - You should see the points earned displayed on the receipt

## Verification Checklist

- [ ] Migration applied successfully in Supabase
- [ ] Store settings shows "Enable Points Rewards" toggle
- [ ] Points toggle can be enabled and saved
- [ ] Creating paid orders awards points to customers
- [ ] Customer points display in the Customers page
- [ ] Points show on receipts
- [ ] Points transactions are logged in point_transactions table

## Database Verification Query

Run this in Supabase SQL Editor to verify the function returns the correct columns:

```sql
-- Test the function with your user ID
SELECT * FROM get_user_stores('your-user-uuid-here');

-- The result should include:
-- store_id, store_name, store_description, store_address,
-- store_phone, store_email, is_owner, is_active,
-- enable_qr, enable_points
```

## Technical Details

### Files Modified
- `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql` (NEW)

### Files That Were Already Correct
- `src/hooks/useOrdersWithNotifications.ts` - Points calculation logic ✅
- `src/hooks/useCustomerPoints.ts` - Points fetching hooks ✅
- `src/components/customers/CustomerPointsCard.tsx` - Points display UI ✅
- `src/components/stores/StoreSettingsCard.tsx` - Settings toggle ✅
- `src/types/multi-tenant.ts` - TypeScript types ✅
- `supabase/migrations/20251101000000_create_customer_points_system.sql` - Database tables ✅
- `supabase/migrations/20251102000000_add_enable_points_to_stores.sql` - enable_points column ✅

### Points Calculation Formula
- **Kilo services**: 1 point per kilogram (rounded)
- **Unit services**: 1 point per unit
- **Combined services**: (KG rounded) + units
- Points only awarded when `payment_status === 'paid'` AND `enable_points === true`

## Support

If you encounter any issues after applying the fix:

1. Check browser console for errors
2. Verify the migration was applied correctly in Supabase
3. Ensure the store has `enable_points = true` in the stores table
4. Check that orders have `payment_status = 'paid'`
5. Review the `point_transactions` table to see if transactions are being logged

## Related Documentation

- `POINTS_QUICK_REFERENCE.md` - Quick reference for points system
- `POINTS_CONFIGURATION_GUIDE.md` - How to configure points per store
- `POINTS_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `CLAUDE.md` - Project documentation (updated with this fix)
