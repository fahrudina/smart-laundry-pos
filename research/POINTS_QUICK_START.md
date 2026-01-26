# Loyalty Points - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Migration (2 minutes)

1. Open Supabase Dashboard → **SQL Editor**
2. Copy contents from: `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql`
3. Paste and click **Run**
4. Wait for success message

### Step 2: Enable Points in Store Settings (1 minute)

1. Login to your POS system as **owner**
2. Go to **Store Management** page
3. Find **"Loyalty Points System"** section
4. Toggle **"Enable Points Rewards"** to ON
5. Click **"Save Settings"**

### Step 3: Test It! (2 minutes)

1. Create a test order:
   - Add a customer (e.g., phone: 081234567890)
   - Add service items (e.g., 5 kg laundry)
   - Set payment status to **"Paid"**
   - Complete the order

2. Check if points were awarded:
   - Go to **Customers** page
   - Find the customer (081234567890)
   - Click to view details
   - You should see **"Poin Loyalitas"** card showing 5 points!

## ✅ Verification Checklist

- [ ] Migration applied successfully
- [ ] Points toggle is ON in Store Settings
- [ ] Test order created with payment = "paid"
- [ ] Customer shows points in Customers page
- [ ] Points appear on receipt

## 📊 How Points Work

### Earning Points
- **Kilo services**: 1 point per kilogram (rounded)
  - Example: 5.7 kg laundry = 6 points
- **Unit services**: 1 point per unit
  - Example: 3 shirts = 3 points
- **Combined services**: both weight + units
  - Example: 2.5 kg + 3 units = 3 + 3 = 6 points

### Requirements
- ✅ Payment status must be **"paid"**
- ✅ Store must have **enable_points = true**
- ❌ Draft orders (pending payment) = no points

## 🔍 Troubleshooting

### Points Not Showing?

**Check 1: Is points enabled?**
```
Go to Store Settings → Check "Enable Points Rewards" is ON
```

**Check 2: Was payment completed?**
```
Only "paid" orders award points, not "pending" or "down_payment"
```

**Check 3: Verify in database (Supabase SQL Editor)**
```sql
-- Replace with your customer's phone number
SELECT * FROM points WHERE customer_phone = '081234567890';
```

### Points UI Not Appearing?

**Refresh the page after enabling points:**
```
1. Enable points in Store Settings
2. Save settings
3. Refresh your browser (F5 or Cmd+R)
4. Points UI should now appear
```

## 📱 Where Points Appear

1. **Customers Page**: Full points card with accumulated/current/redeemed
2. **Customer Details**: Points badge next to customer name
3. **Order Receipt**: Points earned from that specific order
4. **WhatsApp Notifications**: Points earned mentioned in order confirmation

## 🛠️ Advanced Verification

Run this in Supabase SQL Editor:
```sql
-- Check if migration was applied
SELECT * FROM get_user_stores('your-user-uuid-here');
-- Should show enable_points column

-- Check customer points
SELECT
  customer_phone,
  accumulated_points,
  current_points,
  store_id
FROM points;

-- Check recent point transactions
SELECT
  pt.*,
  o.customer_name,
  o.total_amount
FROM point_transactions pt
JOIN orders o ON pt.order_id = o.id
ORDER BY pt.transaction_date DESC
LIMIT 10;
```

## 📚 Related Documentation

- **Full Fix Documentation**: `POINTS_FEATURE_FIX.md`
- **Configuration Guide**: `POINTS_CONFIGURATION_GUIDE.md`
- **Quick Reference**: `POINTS_QUICK_REFERENCE.md`
- **UI Components**: `POINTS_UI_COMPONENTS.md`

## 🆘 Still Not Working?

1. Check browser console for errors (F12 → Console tab)
2. Verify migration file: `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql`
3. Run verification script: `script/verify-points-fix.sql`
4. Check all related migrations have been applied:
   - `20251031000000_create_base_points_tables.sql`
   - `20251101000000_create_customer_points_system.sql`
   - `20251102000000_add_enable_points_to_stores.sql`
   - `20251107000000_fix_get_user_stores_add_enable_points.sql` (NEW)

## 💡 Pro Tips

- **Enable points for existing customers**: They'll start earning on new paid orders
- **Points persist**: Customer keeps points even if they change phone numbers
- **Multi-store**: Each store tracks points separately
- **Transaction log**: All points activities are logged in `point_transactions` table
