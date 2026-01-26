# ⚠️ CRITICAL: Apply Migration NOW

## 🚨 Why Points Still Don't Work

The migration file exists in your code, but **you haven't applied it to your Supabase database yet!**

The migration file is just a SQL script - it doesn't automatically run. You need to manually execute it in Supabase.

## ✅ How to Apply the Migration (5 Minutes)

### Step 1: Copy the Migration SQL

Open this file:
```
supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql
```

Copy ALL the contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C).

### Step 2: Open Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Login to your account
3. Select your project
4. Click **"SQL Editor"** in the left sidebar
5. Click **"New query"**

### Step 3: Paste and Run

1. Paste the copied SQL into the editor
2. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
3. Wait for confirmation message:
   ```
   ==========================================
   MIGRATION COMPLETE
   Function get_user_stores_by_userid now includes enable_qr and enable_points
   Loyalty points and QR code features should now work properly
   ==========================================
   ```

### Step 4: Verify It Worked

Run this query in the same SQL Editor:

```sql
-- Test the function
SELECT * FROM get_user_stores_by_userid('your-user-id-here');

-- Replace 'your-user-id-here' with an actual user ID
-- You can find user IDs by running:
SELECT id, email FROM users LIMIT 5;
```

**Expected Result:**
You should see columns including:
- `store_id`
- `store_name`
- `is_owner`
- `is_active`
- **`enable_qr`** ← Should be here
- **`enable_points`** ← Should be here

If you see those columns, the migration worked! ✅

### Step 5: Restart Your App

1. **In your browser:**
   - Log out of the app
   - Clear cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
   - Or clear localStorage:
     ```javascript
     localStorage.clear();
     ```
   - Refresh page
   - Log back in

2. **Check if it worked:**
   - Open browser console (F12)
   - Look for any errors
   - Navigate around the app
   - The `currentStore` object should now have `enable_points` field

### Step 6: Enable Points in Store Settings

1. Login as store owner
2. Go to **Store Management** → **Store Settings**
3. Find **"Loyalty Points System"** section
4. Toggle **"Enable Points Rewards"** to **ON**
5. Click **"Save Settings"**

### Step 7: Test Points

1. Create a new order:
   - Customer: Test Customer (081234567890)
   - Add service: 5kg Laundry
   - **Payment Status: "Paid"** (Important!)
   - Complete the order

2. Check points were awarded:
   - Go to **Customers** page
   - Find customer 081234567890
   - Should see **"Poin Loyalitas"** card with 5 points

3. Verify in database:
   ```sql
   SELECT * FROM points WHERE customer_phone = '081234567890';
   ```

## 🔍 How to Know if You Need to Apply the Migration

Run this in Supabase SQL Editor:

```sql
-- Check if the function has enable_points
SELECT
  proname,
  pg_get_function_result(oid)
FROM pg_proc
WHERE proname = 'get_user_stores_by_userid';
```

**If the result:**
- ❌ Shows "function does not exist" → **Migration NOT applied**
- ❌ Doesn't include "enable_points" in the result → **Old function still in use**
- ✅ Includes "enable_points" in the result → **Migration already applied**

## 📋 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied migration file contents
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run"
- [ ] Saw success message
- [ ] Verified function returns enable_points column
- [ ] Cleared browser cache/localStorage
- [ ] Logged out and back in
- [ ] Enabled points in Store Settings
- [ ] Created test order with payment="paid"
- [ ] Verified points appeared in Customers page
- [ ] Verified points in database

## 💡 Common Mistake

**Having the migration file in your code ≠ Migration applied to database**

You need to:
1. ✅ Have the migration file (you already have this)
2. ✅ **Apply it in Supabase** (you need to do this NOW)

Think of it like:
- Migration file = Recipe
- Running it in Supabase = Actually cooking the meal

You have the recipe, now you need to cook! 👨‍🍳

## 🆘 If You Get Errors

### Error: "function get_user_stores_by_userid already exists"

**Solution:** The function exists but might be old. Update the migration:

```sql
-- Use CREATE OR REPLACE instead
CREATE OR REPLACE FUNCTION public.get_user_stores_by_userid(user_id UUID)
-- ... rest of the function
```

### Error: "column enable_points does not exist"

**Solution:** Apply the earlier migration first:

```sql
-- Run this first
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS enable_points BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS enable_qr BOOLEAN NOT NULL DEFAULT false;

-- Then run the function migration
```

### Error: Permission denied

**Solution:** Make sure you're logged in as the database owner in Supabase.

---

## 🎯 Summary

**The Problem:** Migration file exists in code but NOT applied to database
**The Solution:** Copy-paste the migration SQL into Supabase SQL Editor and run it
**Time Required:** 5 minutes
**Difficulty:** Easy - just copy and paste!

**After applying:** Points will work immediately! 🎉
