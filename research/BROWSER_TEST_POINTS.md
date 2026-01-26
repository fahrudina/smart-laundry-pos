# Browser Testing Guide for Points Feature

## 🔍 Test if Points are Working (In Browser)

Since you've applied the migration manually, let's test if it's actually working in your application.

### Step 1: Clear Browser Cache

1. **Open your app** in the browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Run this command:**
   ```javascript
   localStorage.clear();
   console.log('Cache cleared!');
   ```
5. **Refresh the page** (F5 or Cmd+R)

### Step 2: Login and Check Store Data

1. **Login to your app** (as owner or staff)
2. **Open Console** (F12) again
3. **Run these commands to check what data the app has:**

   ```javascript
   // Check authentication
   const session = localStorage.getItem('auth_session');
   const user = JSON.parse(session);
   console.log('User:', user);

   // Check if we can access Supabase
   console.log('Supabase available:', typeof supabase !== 'undefined');
   ```

### Step 3: Test the RPC Function Directly

**Run this in the browser console:**

```javascript
// Get your user ID from the session
const session = JSON.parse(localStorage.getItem('auth_session'));
const userId = session.user.id;
console.log('Testing with User ID:', userId);

// Call the RPC function directly
const { data, error } = await supabase.rpc('get_user_stores_by_userid', {
  user_id: userId
});

console.log('=== RPC TEST RESULTS ===');
console.log('Data:', data);
console.log('Error:', error);

if (data && data.length > 0) {
  console.log('✅ Function returned data');
  console.log('First store:', data[0]);
  console.log('Has enable_points?', 'enable_points' in data[0]);
  console.log('enable_points value:', data[0].enable_points);
  console.log('Has enable_qr?', 'enable_qr' in data[0]);
  console.log('enable_qr value:', data[0].enable_qr);
} else {
  console.log('❌ No stores returned');
}
```

**What you should see:**
```
=== RPC TEST RESULTS ===
Data: [{
  store_id: "...",
  store_name: "...",
  enable_qr: false,
  enable_points: false,   // ← This should exist!
  is_owner: true,
  is_active: true
}]
Error: null
✅ Function returned data
Has enable_points? true   // ← Should be true
enable_points value: false // ← false means disabled, true means enabled
Has enable_qr? true
enable_qr value: false
```

**If you see:**
- ❌ `Has enable_points? false` → Migration didn't work, need to reapply
- ✅ `Has enable_points? true` → Migration worked! ✅

### Step 4: Enable Points in Store Settings

1. **Navigate to:** Store Management → Store Settings
2. **Look for:** "Loyalty Points System" section
3. **Toggle:** "Enable Points Rewards" to **ON**
4. **Click:** "Save Settings"
5. **Wait for:** Success toast message

### Step 5: Verify Points are Enabled in Database

**Run this in console:**

```javascript
// Refresh the store data
window.location.reload();

// After reload, run this again:
const session = JSON.parse(localStorage.getItem('auth_session'));
const { data } = await supabase.rpc('get_user_stores_by_userid', {
  user_id: session.user.id
});

console.log('After enabling points:', data[0].enable_points);
// Should now be: true ✅
```

### Step 6: Create a Test Order

1. **Go to POS page** (or order creation page)
2. **Create an order with:**
   - Customer Name: Test Customer
   - Customer Phone: 081234567890
   - Service: 5kg Laundry (or any kilo service)
   - **Payment Status: "Paid"** ← MUST be paid!
   - Payment Method: Cash

3. **Watch the browser console** during order creation
   - You should see logs like:
   ```
   🏪 Current store context: {...}
   📋 Store info for notification: {...}
   🎁 Points earned: 5
   ```

4. **If you see "Points earned: 5"** → It's working! ✅

### Step 7: Verify Points in UI

1. **Go to Customers page**
2. **Find the customer** (081234567890)
3. **Click on the customer** to view details
4. **Look for "Poin Loyalitas" card**
   - Should show: 5 points earned
   - Accumulated: 5
   - Current: 5
   - Redeemed: 0

### Step 8: Verify Points in Database

**Run this in Supabase SQL Editor:**

```sql
-- Check if points were saved
SELECT
  customer_phone,
  accumulated_points,
  current_points,
  store_id,
  created_at
FROM points
WHERE customer_phone = '081234567890';

-- Should show: 1 row with 5 points
```

---

## 🐛 Troubleshooting Results

### If Step 3 shows `enable_points: undefined`

**Problem:** Migration didn't apply correctly or function wasn't refreshed.

**Solution:**
1. Go back to Supabase SQL Editor
2. Run this to force recreate the function:
   ```sql
   DROP FUNCTION IF EXISTS get_user_stores_by_userid(UUID);
   ```
3. Then run the full migration again from:
   `supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql`

### If Step 3 shows `enable_points: false`

**Problem:** Points are disabled in settings.

**Solution:**
- Follow Step 4 to enable points in Store Settings

### If Step 6 shows "Points earned: 0"

**Problem:** Either:
- Points not enabled in store settings
- Payment status is not "paid"
- Order items don't have weight/quantity

**Solution:**
```javascript
// Check current store in console:
const session = JSON.parse(localStorage.getItem('auth_session'));
const { data } = await supabase.rpc('get_user_stores_by_userid', {
  user_id: session.user.id
});
console.log('Store enable_points:', data[0].enable_points);

// If false, enable it in Store Settings
```

### If Step 7 shows no "Poin Loyalitas" card

**Problem:** UI components check `enable_points` and hide if false.

**Solution:**
1. Make sure Step 4 (enabling points) was completed
2. Refresh the page after enabling points
3. Check console for errors

### If no logs appear in Step 6

**Problem:** Order creation hook might not be working.

**Check:**
```javascript
// In console, check which hook is being used:
console.log('Is useCreateOrderWithNotifications imported?');

// Look at the network tab during order creation
// Should see API calls to:
// - /orders (INSERT)
// - /order_items (INSERT)
// - /points (INSERT or UPDATE)
// - /point_transactions (INSERT)
```

---

## ✅ Success Indicators

You know it's working when:

1. ✅ Console shows `enable_points: true` or `enable_points: false` (not undefined)
2. ✅ Store Settings shows "Enable Points Rewards" toggle
3. ✅ Can save points settings successfully
4. ✅ Console shows "Points earned: X" when creating paid orders
5. ✅ Customers page shows "Poin Loyalitas" card
6. ✅ Database `points` table has records
7. ✅ Database `point_transactions` table has records

---

## 📝 Copy-Paste Test Script

Run this all at once in browser console after logging in:

```javascript
(async () => {
  console.log('=== POINTS FEATURE TEST ===');

  // 1. Get session
  const session = JSON.parse(localStorage.getItem('auth_session'));
  if (!session) {
    console.error('❌ Not logged in');
    return;
  }
  console.log('✅ Logged in as:', session.user.email);

  // 2. Test RPC function
  const { data, error } = await supabase.rpc('get_user_stores_by_userid', {
    user_id: session.user.id
  });

  if (error) {
    console.error('❌ RPC Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.error('❌ No stores found');
    return;
  }

  const store = data[0];
  console.log('✅ Store found:', store.store_name);

  // 3. Check fields
  const hasEnablePoints = 'enable_points' in store;
  const hasEnableQr = 'enable_qr' in store;

  console.log('enable_points field exists:', hasEnablePoints ? '✅' : '❌');
  console.log('enable_qr field exists:', hasEnableQr ? '✅' : '❌');

  if (hasEnablePoints) {
    console.log('enable_points value:', store.enable_points);
    if (store.enable_points) {
      console.log('✅ Points are ENABLED');
    } else {
      console.log('⚠️ Points are DISABLED (enable in Store Settings)');
    }
  } else {
    console.log('❌ MIGRATION NOT APPLIED CORRECTLY');
    console.log('Action: Rerun migration in Supabase SQL Editor');
  }

  // 4. Summary
  console.log('\n=== SUMMARY ===');
  if (hasEnablePoints && store.enable_points) {
    console.log('✅ ALL GOOD! Points feature should work.');
    console.log('Next: Create a paid order to test points awarding');
  } else if (hasEnablePoints && !store.enable_points) {
    console.log('⚠️ Almost there! Enable points in Store Settings');
  } else {
    console.log('❌ Migration not applied. Rerun migration in Supabase.');
  }
})();
```

This will give you a clear YES/NO answer on whether the points feature is ready to use.
