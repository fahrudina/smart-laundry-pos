# Points System UI Components Documentation

## Overview

This document describes the UI components created to display customer loyalty points throughout the application. These components provide customers with visibility into their points balance and earning history.

## Created Components

### 1. Custom Hook: `useCustomerPoints`

**Location:** `src/hooks/useCustomerPoints.ts`

**Purpose:** Fetches customer points data from the database using React Query.

**Exports:**
- `useCustomerPoints(customerPhone)` - Fetches points for a specific customer
- `useCustomerPointTransactions(customerPhone, limit)` - Fetches transaction history
- `useStorePointsStats()` - Fetches aggregate statistics for the current store

**Usage Example:**
```tsx
import { useCustomerPoints } from '@/hooks/useCustomerPoints';

const MyComponent = ({ customerPhone }) => {
  const { data: points, isLoading } = useCustomerPoints(customerPhone);

  return (
    <div>
      {points && <p>Available Points: {points.current_points}</p>}
    </div>
  );
};
```

**Features:**
- Automatic caching with React Query
- Store-scoped queries (multi-tenant support)
- Loading and error states
- Optimistic updates

### 2. CustomerPointsCard Component

**Location:** `src/components/customers/CustomerPointsCard.tsx`

**Purpose:** Displays detailed customer points information in a card format.

**Props:**
```tsx
interface CustomerPointsCardProps {
  customerPhone: string;        // Customer's phone number
  showTransactions?: boolean;   // Show recent transactions (default: false)
  compact?: boolean;            // Compact layout (default: false)
}
```

**Features:**
- **Three display modes:**
  1. Full card with statistics
  2. Compact card (single line)
  3. Empty state for customers with no points

- **Displays:**
  - Current available points
  - Total accumulated points
  - Total redeemed points
  - Recent transaction history (optional)
  - Points earning rules information

- **Visual design:**
  - Gradient backgrounds for different metrics
  - Icon indicators
  - Responsive layout
  - Loading skeletons

**Usage Examples:**

**Full Card:**
```tsx
<CustomerPointsCard
  customerPhone="08123456789"
  showTransactions={true}
  compact={false}
/>
```

**Compact Card:**
```tsx
<CustomerPointsCard
  customerPhone="08123456789"
  showTransactions={false}
  compact={true}
/>
```

### 3. CustomerPointsBadge Component

**Location:** `src/components/customers/CustomerPointsBadge.tsx`

**Purpose:** Small inline badge showing customer's current points.

**Props:**
```tsx
interface CustomerPointsBadgeProps {
  customerPhone: string;  // Customer's phone number
}
```

**Features:**
- Compact inline display
- Golden color scheme for points
- Loading skeleton
- Handles zero points gracefully

**Usage:**
```tsx
<CustomerPointsBadge customerPhone="08123456789" />
```

**Displays:**
- Star icon + point count
- Styled with amber/gold colors
- Minimal space usage (fits in table cells)

## Integration Points

### 1. CustomersPage

**Location:** `src/pages/CustomersPage.tsx`

**Integrations:**

**A. Customer Table:**
- Added `CustomerPointsBadge` in the "Orders" column
- Shows points inline with order count
- Visible only on larger screens (sm:table-cell)

```tsx
<TableCell className="hidden sm:table-cell">
  <div className="flex flex-col gap-1">
    <Badge variant="secondary">
      {customer._count?.orders || 0} orders
    </Badge>
    <CustomerPointsBadge customerPhone={customer.phone} />
  </div>
</TableCell>
```

**B. Customer Details Dialog:**
- Added compact `CustomerPointsCard` below order count
- Shows when viewing customer details
- Provides at-a-glance points overview

```tsx
<CustomerPointsCard
  customerPhone={selectedCustomer.phone}
  showTransactions={false}
  compact={true}
/>
```

### 2. PublicReceiptPage

**Location:** `src/pages/PublicReceiptPage.tsx`

**Integrations:**

**A. Points Earned Badge:**
- Shows points earned from this specific order
- Only visible when payment is completed
- Highlighted with gold/amber styling

**Location:** After payment method display

```tsx
{order.payment_status === 'completed' && order.points_earned && order.points_earned > 0 && (
  <div className="flex justify-between items-center bg-amber-50 -mx-3 px-3 py-2 rounded">
    <div className="flex items-center gap-2">
      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
      <span className="text-gray-600 font-medium">Poin Didapat</span>
    </div>
    <span className="text-amber-600 font-bold">
      +{order.points_earned} poin
    </span>
  </div>
)}
```

**B. Customer Points Balance:**
- Shows total points balance after payment details
- Uses compact `CustomerPointsCard`
- Includes helpful message about point usage

**Location:** Before "Catatan" section

```tsx
{order.payment_status === 'completed' && (
  <div className="p-4 border-t border-gray-200">
    <CustomerPointsCard
      customerPhone={order.customer_phone}
      showTransactions={false}
      compact={true}
    />
    <p className="text-xs text-gray-500 text-center mt-2">
      Poin dapat digunakan untuk diskon pada transaksi berikutnya
    </p>
  </div>
)}
```

### 3. OrderSuccessDialog

**Location:** `src/components/pos/OrderSuccessDialog.tsx`

**Integration:**

**New Prop:**
```tsx
pointsEarned?: number;  // Points earned from this order
```

**Display:**
- Shows celebratory points earned message
- Positioned after WhatsApp confirmation
- Eye-catching design with gradient background

```tsx
{pointsEarned && pointsEarned > 0 && (
  <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4">
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full">
        <Star className="h-5 w-5 text-white fill-white" />
      </div>
      <div className="text-center">
        <p className="text-sm text-amber-700 font-medium">Pelanggan mendapat</p>
        <p className="text-2xl font-bold text-amber-600">+{pointsEarned} Poin</p>
      </div>
    </div>
    <p className="text-xs text-amber-600 text-center mt-2">
      🎉 Poin dapat digunakan untuk diskon pada transaksi berikutnya
    </p>
  </div>
)}
```

## Visual Design

### Color Scheme

**Points Display:**
- Primary: Amber (#f59e0b)
- Secondary: Orange (#fb923c)
- Backgrounds: Amber-50, Orange-50
- Text: Amber-600, Amber-700

**Icons:**
- Star (filled) for points
- TrendingUp for accumulated points
- Award for available points
- Clock for transaction history

### Responsive Behavior

**CustomerPointsCard:**
- Full layout on desktop (md+)
- Stacked layout on mobile
- Maintains readability on all screen sizes

**CustomerPointsBadge:**
- Hidden on mobile in customer table
- Visible on tablets and above (sm+)
- Minimal space usage

## User Experience Flow

### 1. Order Creation Flow

**Before (without UI):**
- Customer completes order
- Points awarded in background
- No visibility to customer or staff

**After (with UI):**
1. Customer completes order with payment
2. `OrderSuccessDialog` shows points earned immediately
3. Staff can see confirmation that points were awarded
4. Customer receives WhatsApp with points information

### 2. Receipt Viewing Flow

**Before (without UI):**
- Receipt shows only payment details
- No points information visible

**After (with UI):**
1. Customer opens public receipt link
2. See points earned from this order (highlighted)
3. See total points balance (below payment details)
4. Understand they can use points for discounts

### 3. Customer Management Flow

**Before (without UI):**
- Staff views customer list
- No points visibility
- Need to check database manually

**After (with UI):**
1. Staff sees points badge in customer table
2. Click customer to view details
3. See full points breakdown in dialog
4. Can inform customer of their balance

## Testing Checklist

### Component Testing

- [ ] **useCustomerPoints Hook**
  - [ ] Fetches points correctly for valid customer
  - [ ] Returns null for customer with no points
  - [ ] Respects store_id filtering
  - [ ] Shows loading state
  - [ ] Handles errors gracefully

- [ ] **CustomerPointsCard**
  - [ ] Displays full layout correctly
  - [ ] Displays compact layout correctly
  - [ ] Shows empty state for new customers
  - [ ] Calculates redeemed points correctly
  - [ ] Shows transactions when enabled
  - [ ] Handles loading state
  - [ ] Responsive on mobile/tablet/desktop

- [ ] **CustomerPointsBadge**
  - [ ] Shows correct point count
  - [ ] Displays golden styling
  - [ ] Shows loading skeleton
  - [ ] Handles zero points
  - [ ] Fits in table cells

### Integration Testing

- [ ] **CustomersPage**
  - [ ] Badge appears in customer table
  - [ ] Card appears in customer details
  - [ ] Updates when customer changes
  - [ ] Works with pagination
  - [ ] Works with search/filter

- [ ] **PublicReceiptPage**
  - [ ] Points earned section shows correctly
  - [ ] Points balance card displays
  - [ ] Only shows when payment completed
  - [ ] Matches order's points_earned value
  - [ ] Loads customer points correctly

- [ ] **OrderSuccessDialog**
  - [ ] Points section appears when points > 0
  - [ ] Doesn't appear when points = 0
  - [ ] Shows correct point count
  - [ ] Visually distinct and celebratory
  - [ ] Works with different payment methods

## Maintenance Notes

### Data Dependencies

**Required Database Fields:**
- `orders.points_earned` - Points from specific order
- `points.current_points` - Available point balance
- `points.accumulated_points` - Lifetime total
- `points.customer_phone` - Link to customer
- `points.store_id` - Multi-tenant isolation

**Required Functions:**
- `calculate_order_points(order_id)` - SQL function for calculating points

### Query Keys

**React Query Cache Keys:**
```tsx
['customer-points', customerPhone, store_id]
['customer-point-transactions', customerPhone, store_id, limit]
['store-points-stats', store_id]
```

**Cache Invalidation:**
- Points queries auto-refresh when order status changes
- Manual invalidation may be needed for manual point adjustments

### Localization

**Current Language:** Indonesian (Bahasa Indonesia)

**Text Strings:**
- "Poin Loyalitas" - Loyalty Points
- "Poin Tersedia" - Available Points
- "Total Terkumpul" - Total Accumulated
- "Telah Ditukar" - Already Redeemed
- "Pelanggan mendapat" - Customer receives
- "Poin dapat digunakan..." - Points can be used...

### Performance Considerations

**Optimizations:**
- React Query caching reduces API calls
- Lazy loading of transaction history
- Compact mode for list views
- Skeleton loaders prevent layout shift

**Monitoring:**
- Watch for slow queries on large transaction histories
- Monitor bundle size impact
- Check mobile performance

## Future Enhancements

### Planned Features

1. **Point Redemption UI**
   - Redemption dialog in POS
   - Point-to-discount conversion
   - Confirmation flow

2. **Points Dashboard**
   - Owner view of all customer points
   - Analytics and trends
   - Top customers by points

3. **Point History Details**
   - Expandable transaction list
   - Link to original orders
   - Filter/search transactions

4. **Gamification**
   - Point milestones
   - Achievement badges
   - Tier system (bronze, silver, gold)

5. **Point Expiration**
   - Show expiring points
   - Warning notifications
   - Grace period handling

### Known Limitations

1. **No Real-time Updates**
   - Points don't update automatically across sessions
   - Requires page refresh or navigation

2. **No Bulk Operations**
   - No bulk point adjustments UI
   - Manual adjustments require database access

3. **Limited Transaction Details**
   - Basic transaction info only
   - No detailed order link from transaction

4. **No Export Feature**
   - Can't export point history
   - No PDF/CSV generation

## Troubleshooting

### Common Issues

**Issue: Points not displaying**
- Check customer_phone matches exactly
- Verify store_id filtering is correct
- Ensure points record exists in database
- Check browser console for errors

**Issue: Wrong point count**
- Verify orders.points_earned is populated
- Check for orphaned point_transactions
- Recalculate using `calculate_order_points()`
- Check accumulated vs current points

**Issue: Loading spinner forever**
- Check network tab for failed requests
- Verify Supabase connection
- Check RLS policies on points tables
- Ensure current store is set

**Issue: Component not rendering**
- Check import paths
- Verify component is in correct directory
- Check for TypeScript errors
- Ensure hooks are used correctly

## Support

For questions or issues:
1. Check this documentation
2. Review `POINTS_QUICK_REFERENCE.md` for SQL queries
3. Check `POINTS_DEPLOYMENT_GUIDE.md` for setup issues
4. Review browser console for errors
5. Check Supabase logs for database issues

## Version History

**v1.0.0** (November 2, 2025)
- Initial UI components release
- CustomersPage integration
- PublicReceiptPage integration
- OrderSuccessDialog integration
- Full documentation

---

**Last Updated:** November 2, 2025
**Status:** Production Ready
