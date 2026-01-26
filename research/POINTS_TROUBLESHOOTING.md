# Points Feature Troubleshooting Guide

## 🔍 Why Points Still Not Working?

Even after updating the `get_user_stores_by_userid` function, there are several reasons why points might not work:

## Checklist to Debug

### ✅ Step 1: Verify Migration Was Applied in Supabase

**Run this in Supabase SQL Editor:**

```sql
-- Test if the function returns the correct columns
SELECT * FROM get_user_stores_by_userid('your-user-id-here');

-- Expected columns should include:
-- store_id, store_name, store_description, store_address,
-- store_phone, store_email, is_owner, is_active,
-- enable_qr, enable_points
```

**What to check:**
- ❌ If error "function does not exist" → Migration not applied
- ❌ If missing `enable_points` column → Old function still in use
- ✅ If shows all columns including `enable_points` → Function is correct

---

### ✅ Step 2: Verify Store Has Points Enabled

**Run this in Supabase SQL Editor:**

```sql
-- Check current store settings
SELECT
  id,
  name,
  enable_qr,
  enable_points,
  CASE WHEN enable_points THEN '✅ Points Enabled' ELSE '❌ Points Disabled' END as status
FROM stores
ORDER BY created_at DESC;
```

**What to check:**
- ❌ If `enable_points = false` → Need to enable in Store Settings
- ❌ If `enable_points = NULL` → Migration not applied
- ✅ If `enable_points = true` → Points should work

**To fix:**
1. Login to app as owner
2. Go to Store Management → Store Settings
3. Toggle "Enable Points Rewards" to ON
4. Click "Save Settings"

---

### ✅ Step 3: Check if StoreContext Receives enable_points

**Open Browser Console (F12) and run:**

```javascript
// After logging in, check what's in localStorage
const session = localStorage.getItem('auth_session');
console.log('Auth Session:', JSON.parse(session));

// Check if StoreContext has the data
// Navigate to any page, then check React DevTools → Components → StoreProvider
// Look at currentStore object - should have enable_points field
```

**What to check:**
- ❌ If `currentStore.enable_points` is `undefined` → Data not flowing from DB
- ✅ If `currentStore.enable_points` is `true` or `false` → Data flowing correctly

---

### ✅ Step 4: Test Points Awarding Logic

**Create a test order with these settings:**

```javascript
// Order details
Customer: Test Customer
Phone: 081234567890
Service: 5kg Laundry (kilo service)
Payment Status: "paid" (IMPORTANT!)
Payment Method: "cash"
```

**Check browser console for logs:**
```javascript
// Should see these logs in console:
"🏪 Current store context:"
"📋 Store info for notification:"
"🎁 Points earned: 5"
```

**What to check:**
- ❌ No logs → Points logic not executing
- ❌ "Points earned: 0" → Calculation issue or enable_points is false
- ✅ "Points earned: 5" → Logic working

---

### ✅ Step 5: Verify Points in Database

**Run this in Supabase SQL Editor:**

```sql
-- Check if points were actually saved
SELECT
  p.customer_phone,
  p.accumulated_points,
  p.current_points,
  p.store_id,
  s.name as store_name,
  p.created_at
FROM points p
JOIN stores s ON p.store_id = s.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check point transactions
SELECT
  pt.transaction_id,
  pt.points_changed,
  pt.transaction_type,
  pt.transaction_date,
  pt.order_id,
  o.customer_name
FROM point_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
ORDER BY pt.transaction_date DESC
LIMIT 10;

-- Check if orders have points_earned
SELECT
  id,
  customer_name,
  customer_phone,
  payment_status,
  points_earned,
  created_at
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 10;
```

**What to check:**
- ❌ No rows in `points` table → Points not being saved
- ❌ `points_earned = 0` or `NULL` in orders → Calculation not happening
- ✅ Rows exist with correct points → System working

---

## 🔧 Common Issues & Solutions

### Issue 1: Migration Not Applied in Production

**Problem:** You updated the migration file locally but didn't apply it in Supabase.

**Solution:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql`
4. Paste and run
5. Wait for success message

---

### Issue 2: Old Function Name Still in Use

**Problem:** The original function was named `get_user_stores` but you renamed it to `get_user_stores_by_userid`.

**Solution:** Both functions need to exist OR update one consistently everywhere.

**Check which function is being called:**
```typescript
// In src/services/authService.ts line 312
const { data, error } = await supabase.rpc('get_user_stores_by_userid', {
  user_id: this.session!.user.id
});
```

**Fix:** Make sure the migration creates the function with the SAME name as called in code.

---

### Issue 3: Browser Cache

**Problem:** Browser cached the old store data without `enable_points`.

**Solution:**
1. Log out of the app
2. Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
3. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
4. Refresh page (F5)
5. Log in again

---

### Issue 4: Payment Status Not "paid"

**Problem:** Points are only awarded when `payment_status === 'paid'`.

**Solution:** When creating orders, make sure to set:
```javascript
payment_status: 'paid'  // NOT 'pending' or 'down_payment'
```

---

### Issue 5: Store Points Not Enabled

**Problem:** Even with correct data flow, if `enable_points = false` in the store, no points will be awarded.

**Solution:** Enable in Store Settings (as owner).

---

## 🐛 Debug Script

Run this comprehensive check in Supabase SQL Editor:

```sql
-- ===========================================
-- COMPREHENSIVE POINTS SYSTEM DEBUG
-- ===========================================

-- 1. Check if function exists and its signature
SELECT
  'Function Check' as section,
  proname as function_name,
  pg_get_function_result(oid) as returns,
  CASE
    WHEN pg_get_function_result(oid) LIKE '%enable_points%'
    THEN '✅ Returns enable_points'
    ELSE '❌ Missing enable_points'
  END as status
FROM pg_proc
WHERE proname IN ('get_user_stores', 'get_user_stores_by_userid');

-- 2. Check stores table structure
SELECT
  'Stores Table Check' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('enable_points', 'enable_qr')
ORDER BY column_name;

-- 3. Check current store settings
SELECT
  'Store Settings' as section,
  id,
  name,
  enable_qr,
  enable_points,
  CASE WHEN enable_points THEN '✅ ON' ELSE '❌ OFF' END as points_status
FROM stores;

-- 4. Check points tables exist
SELECT
  'Points Tables' as section,
  tablename,
  '✅ EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('points', 'point_transactions')
ORDER BY tablename;

-- 5. Check recent paid orders
SELECT
  'Recent Paid Orders' as section,
  id,
  customer_name,
  customer_phone,
  payment_status,
  COALESCE(points_earned, 0) as points_earned,
  created_at
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if any customer has points
SELECT
  'Customer Points' as section,
  customer_phone,
  accumulated_points,
  current_points,
  store_id
FROM points
ORDER BY created_at DESC
LIMIT 5;

-- Summary
SELECT
  '=========================================',
  'DEBUG COMPLETE',
  'Review all sections above for issues',
  '=========================================';
```

---

## 💡 Quick Fix Checklist

Work through this in order:

1. **[ ]** Apply migration in Supabase SQL Editor
2. **[ ]** Verify function returns `enable_points` column
3. **[ ]** Clear browser cache and localStorage
4. **[ ]** Log out and log back in
5. **[ ]** Enable points in Store Settings (as owner)
6. **[ ]** Create test order with `payment_status = 'paid'`
7. **[ ]** Check browser console for "Points earned: X" log
8. **[ ]** Check `points` table in Supabase for new record
9. **[ ]** Check customer in app shows points

If all steps pass but still not working, check:
- Network tab (F12) for API errors
- Browser console for JavaScript errors
- Supabase logs for database errors

---

## 🆘 Still Not Working?

If you've tried everything above and it's still not working, run this final diagnostic:

```javascript
// In browser console after logging in:

// 1. Check auth
const auth = localStorage.getItem('auth_session');
console.log('Auth:', JSON.parse(auth));

// 2. Make a direct API call to test the function
const { createClient } = supabase;
const userId = 'your-user-id-here';

const { data, error } = await supabase.rpc('get_user_stores_by_userid', {
  user_id: userId
});

console.log('RPC Result:', data);
console.log('RPC Error:', error);
console.log('Has enable_points?', data?.[0]?.enable_points !== undefined);
```

This will tell you exactly what's coming back from the database.
