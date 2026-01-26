# Fix: Owner laundry user can only edit latest store created - Issue #11

## Problem Summary
A user with the role 'owner laundry' was only able to edit the latest store created. When the user switched to another store:
1. **Application became stuck/unresponsive** - could not click any menu items
2. **After page refresh** - all functionality returned but current store reverted to the latest store created

## Root Cause Analysis
The issue had **two main causes**:

### 1. Incorrect `isOwner` Determination (UI Issue)
The `isOwner` flag in `StoreContext.tsx` was being determined globally based on the user's role (`authService.isOwner()`) rather than per-store ownership. This meant:
- The global `isOwner` flag was set once based on the user's role being 'laundry_owner'
- However, each store has its own `is_owner` flag returned from the database
- When switching stores, the global `isOwner` wasn't reflecting the per-store ownership

### 2. Unnecessary Store Refreshing (Stuck Application Issue)
The main cause of the "stuck" application was that switching stores was triggering unnecessary calls to `refreshStores()`, which would:
- Set `loading = true` in the StoreContext
- Make the entire application unresponsive via `ProtectedRoute`
- This happened because the `useEffect` watching for user changes was too sensitive

### 3. Poor Store Persistence Logic (Revert to Latest Store Issue)
The store selection logic was always defaulting to the first store (`stores[0]`) when the persisted store couldn't be maintained, and since stores are ordered by `created_at DESC`, this always meant the latest created store.

## Solution Implemented

### Fix 1: Per-Store `isOwner` Determination
Changed the `isOwner` determination from a state variable to a computed value:

**Before:**
```typescript
const [isOwner, setIsOwner] = useState(false);
setIsOwner(authService.isOwner());
```

**After:**
```typescript
const isOwner = currentStore?.is_owner ?? false;
```

### Fix 2: Prevent Unnecessary Store Refreshing
Modified the `useEffect` dependency to only trigger on actual user ID changes:

**Before:**
```typescript
useEffect(() => {
  // ... refresh logic
}, [user]); // Triggers on any user object change
```

**After:**
```typescript
useEffect(() => {
  // ... refresh logic
}, [user?.id]); // Only triggers when user ID actually changes
```

### Fix 3: Improved Store Persistence Logic
Enhanced the store selection logic to better preserve user's choice:

**Before:**
```typescript
// Always fell back to stores[0] (latest store)
return stores[0];
```

**After:**
```typescript
// Priority 1: Keep current store if still accessible
// Priority 2: Use persisted store if available  
// Priority 3: Only auto-select first store if no current store
// Priority 4: Keep current state instead of auto-switching
```

### Fix 4: Enhanced Debugging
Added comprehensive logging to `switchStore` function to help diagnose future issues.

## Files Modified
- `src/contexts/StoreContext.tsx`

## Verification Steps
1. ✅ Application compiles and runs without errors
2. ✅ Store switching no longer causes application to become stuck
3. ✅ `isOwner` is properly determined per-store
4. ✅ Store selection is preserved across page refreshes
5. ✅ No unnecessary loading states during store switching
6. ✅ Enhanced logging for debugging

## Expected Behavior After Fix
- ✅ Owner laundry users can switch between stores without application becoming unresponsive
- ✅ Menu options remain enabled when switching between stores based on actual ownership
- ✅ Refreshing the page maintains the selected store (not reverting to latest)
- ✅ Store-specific ownership is properly reflected in the UI
- ✅ No loading screens during simple store switches

This comprehensive fix addresses all aspects of the original issue: the UI becoming stuck, menu disabling, and reverting to the latest store on refresh.
