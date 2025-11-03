# Points System Configuration Guide

## Overview

The loyalty points system is now **configurable per store**. Each store can independently enable or disable the points reward feature through the Store Settings interface.

## How It Works

### Store-Level Configuration

Each store has an `enable_points` flag in the database that controls whether:
- Points are automatically awarded to customers
- Points UI components are displayed
- Points information appears on receipts

**Default State:** Disabled (`enable_points = false`)

### Configuration Flow

```
Store Owner → Store Settings → Toggle "Enable Points Rewards"
                    ↓
              Save Settings
                    ↓
         Points system activated
                    ↓
    Orders start awarding points to customers
```

## Enabling/Disabling Points

### For Store Owners

**To Enable Points:**
1. Navigate to **Store Management** (`/stores`)
2. Scroll to **Store Settings** section
3. Find **Loyalty Points System**
4. Toggle **Enable Points Rewards** to ON
5. Click **Save Settings**

**To Disable Points:**
1. Follow same steps as above
2. Toggle **Enable Points Rewards** to OFF
3. Click **Save Settings**

### What Happens When Enabled

✅ **Point Awarding:**
- Customers automatically earn points on paid orders
- 1 point per kilogram for weight-based services
- 1 point per unit for count-based services
- Points saved to database and linked to customer

✅ **UI Display:**
- Points badges appear in customer table
- Points cards show in customer details
- Points information on public receipts
- Points count in order success dialog

✅ **Notifications:**
- WhatsApp notifications include points earned
- Receipt shows points balance

### What Happens When Disabled

❌ **No Point Awarding:**
- Orders are processed normally
- No points calculations performed
- No data saved to points tables
- Payment still works as usual

❌ **No UI Display:**
- Points components are hidden
- Customer table shows no points badges
- Receipts don't show points
- Success dialog doesn't mention points

❌ **Clean Experience:**
- Customers don't see any points-related information
- System behaves as if points feature doesn't exist
- No confusion for stores not using the feature

## Database Schema

### Migration

**File:** `supabase/migrations/20251102000000_add_enable_points_to_stores.sql`

Adds `enable_points` column to `stores` table:

```sql
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS enable_points BOOLEAN NOT NULL DEFAULT false;
```

**Default Value:** `false` (disabled)

### Stores Table

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID REFERENCES users(id),
  enable_qr BOOLEAN DEFAULT false,
  enable_points BOOLEAN DEFAULT false,  -- NEW
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Code Implementation

### 1. Type Definitions

**File:** `src/types/multi-tenant.ts`

```typescript
export interface Store {
  // ... other fields
  enable_points: boolean;  // Added
}

export interface StoreWithOwnershipInfo {
  // ... other fields
  enable_points: boolean;  // Added
}
```

### 2. Point Awarding Logic

**File:** `src/hooks/useOrdersWithNotifications.ts`

```typescript
// Points only awarded if store has points enabled
if (orderData.payment_status === 'paid' && currentStore?.enable_points) {
  // Calculate and award points
  // ...
}
```

### 3. UI Components

**CustomerPointsCard** (`src/components/customers/CustomerPointsCard.tsx`)
```typescript
// Don't show if store doesn't have points enabled
if (!currentStore?.enable_points) {
  return null;
}
```

**CustomerPointsBadge** (`src/components/customers/CustomerPointsBadge.tsx`)
```typescript
// Don't show if store doesn't have points enabled
if (!currentStore?.enable_points) {
  return null;
}
```

**PublicReceiptPage** (`src/pages/PublicReceiptPage.tsx`)
```typescript
// Only show if store has points enabled
{storeInfo?.enable_points && order.payment_status === 'completed' && (
  <CustomerPointsCard ... />
)}
```

### 4. Store Settings UI

**File:** `src/components/stores/StoreSettingsCard.tsx`

Features:
- Toggle switch for enable_points
- Information panel when enabled
- Saves to database on click
- Only accessible to store owners

## Receipt Function Update

### Migration

**File:** `supabase/migrations/20251102000001_update_receipt_function_add_points.sql`

Updates `get_receipt_data()` function to include:
- `points_earned` from orders table
- `enable_points` from stores table

This allows public receipts to check if they should display points.

## Testing

### Test Scenarios

**Scenario 1: Enable Points for Store**
1. Login as store owner
2. Go to Store Settings
3. Enable points
4. Create a paid order
5. Verify:
   - Points awarded to customer
   - Points visible in customer table
   - Points shown on receipt
   - Success dialog shows points

**Scenario 2: Disable Points for Store**
1. Disable points in settings
2. Create a paid order
3. Verify:
   - No points awarded
   - No points UI visible
   - Receipt has no points
   - Success dialog has no points

**Scenario 3: Mixed Stores**
1. Store A: Points enabled
2. Store B: Points disabled
3. Create orders in both
4. Verify isolation (Store A awards points, Store B doesn't)

## Multi-Tenant Behavior

### Store Isolation

Each store's `enable_points` setting is **completely independent**:

```
Store A: enable_points = true
  → Customers earn points
  → Points UI visible

Store B: enable_points = false
  → No points awarded
  → No points UI shown

Store C: enable_points = true
  → Customers earn points
  → Points UI visible
```

### Owner with Multiple Stores

An owner can configure each store differently:
- Enable points for main store
- Disable for secondary locations
- Mix and match based on business needs

## Migration Guide

### For Existing Installations

**Step 1: Apply Migrations**
```sql
-- Run migrations in order:
1. supabase/migrations/20251102000000_add_enable_points_to_stores.sql
2. supabase/migrations/20251102000001_update_receipt_function_add_points.sql
```

**Step 2: Verify Default State**
```sql
-- Check all stores have points disabled
SELECT id, name, enable_points
FROM stores;

-- All should show enable_points = false
```

**Step 3: Enable for Selected Stores**
```sql
-- Enable points for specific stores
UPDATE stores
SET enable_points = true
WHERE id = 'store-uuid-here';
```

Or use the UI (recommended).

### For New Installations

Points are disabled by default. Store owners must explicitly enable via UI.

## Best Practices

### When to Enable Points

✅ **Enable if:**
- You want to reward loyal customers
- You have repeat customers
- You want to increase customer retention
- You can manage point redemption (future feature)

❌ **Don't enable if:**
- You have mostly one-time customers
- You don't want to track customer loyalty
- You're not ready to manage points program
- You want a simpler checkout experience

### Communication

**Before Enabling:**
- Inform staff about points system
- Explain how customers earn points
- Prepare for customer questions
- Update marketing materials

**After Enabling:**
- Monitor customer feedback
- Track point distribution
- Plan redemption strategy
- Consider promotional multipliers

## Troubleshooting

### Points Not Awarded

**Check:**
1. Is `enable_points` true for the store?
   ```sql
   SELECT enable_points FROM stores WHERE id = 'store-uuid';
   ```

2. Is payment_status 'paid'?
   ```sql
   SELECT payment_status FROM orders WHERE id = 'order-uuid';
   ```

3. Are there errors in console/logs?

### Points UI Not Showing

**Check:**
1. Store context has `enable_points` field
2. StoreContext is providing correct value
3. Components are receiving currentStore
4. Browser cache (try hard refresh)

### Setting Won't Save

**Check:**
1. User is store owner (not staff)
2. Store ID is correct
3. Database permissions (RLS policies)
4. Network connectivity
5. Browser console for errors

## Future Enhancements

### Planned Features

1. **Point Redemption Configuration**
   - Set redemption rate (points per currency)
   - Minimum redemption threshold
   - Maximum discount percentage

2. **Point Expiration Settings**
   - Set expiration period (e.g., 1 year)
   - Grace period before expiration
   - Notification before expiration

3. **Promotional Settings**
   - Double points days
   - Point multipliers for specific services
   - Welcome bonus points for new customers

4. **Advanced Configuration**
   - Different point rates per service type
   - Tier systems (bronze, silver, gold)
   - Referral point bonuses

## API Reference

### Check if Store Has Points Enabled

```typescript
import { useStore } from '@/contexts/StoreContext';

const MyComponent = () => {
  const { currentStore } = useStore();

  const pointsEnabled = currentStore?.enable_points ?? false;

  if (pointsEnabled) {
    // Show points UI
  }
};
```

### Update Store Points Setting

```typescript
import { supabase } from '@/integrations/supabase/client';

const updatePointsSetting = async (storeId: string, enabled: boolean) => {
  const { error } = await supabase
    .from('stores')
    .update({
      enable_points: enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', storeId);

  if (error) throw error;
};
```

## Support

For questions or issues:
1. Check this guide
2. Review `POINTS_QUICK_REFERENCE.md`
3. Check `POINTS_UI_COMPONENTS.md`
4. Verify migrations applied correctly
5. Check browser console for errors

## Summary

The points system is now **fully configurable** at the store level:
- ✅ Store owners control via UI
- ✅ Default is disabled (opt-in)
- ✅ Complete store isolation
- ✅ Clean experience when disabled
- ✅ No breaking changes

Enable points only when ready to manage a loyalty program!

---

**Last Updated:** November 2, 2025
**Version:** 2.0.0 (Configurable Points)
**Status:** Production Ready
