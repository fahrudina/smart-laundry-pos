# Payment Summary Cards Implementation

## Overview
This document describes the implementation of horizontal payment summary cards on the Order History (Report) page, visible only to users with the "owner" role.

## Feature Requirements
✅ Display payment summary information in horizontal card format
✅ Show four key metrics:
   - Total amount paid
   - Total amount pending
   - Total amount paid with QRIS
   - Total amount paid with cash
✅ Values reflect current filter selection (today, yesterday, date range, etc.)
✅ Visible only to users with "owner" role
✅ Cards are horizontal with carousel/slide functionality
✅ Two cards visible on mobile, swipe to see others
✅ Responsive design for all screen sizes

## Implementation Details

### Component Structure
- **File**: `src/components/orders/PaymentSummaryCards.tsx`
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components (Card, Carousel)
- **Icons**: lucide-react

### Integration
- **Location**: `src/pages/OrderHistoryOptimized.tsx`
- **Position**: Above the orders list, below the filter section
- **Access Control**: Uses `isOwner` from `useStore()` context

### Payment Calculation Logic

#### Total Paid
- Sums all orders with `payment_status === 'completed'`
- Uses `payment_amount` if available, otherwise `total_amount`

#### Total Pending
- Includes orders with `payment_status === 'pending'`
- For `payment_status === 'down_payment'`:
  - Calculates remaining: `total_amount - payment_amount`
  - Only unpaid balance is counted

#### QRIS Payments
- Filters completed payments where `payment_method === 'qris'`
- Accumulates total QRIS payment amounts

#### Cash Payments
- Filters completed payments where `payment_method === 'cash'`
- Accumulates total cash payment amounts

### Responsive Design

#### Mobile (< 640px)
- Shows 85% of card width
- Smooth swipe navigation
- No visible navigation buttons
- Cards slide horizontally

#### Tablet (640px - 1024px)
- Shows 2 cards at once (50% width each)
- Swipe navigation still available

#### Desktop (> 1024px)
- Shows all 4 cards (25% width each)
- Arrow navigation buttons visible
- Hover effects for better UX

### Card Design
Each card includes:
- **Color-coded background**:
  - Green for Total Paid
  - Orange for Total Pending
  - Blue for QRIS Payments
  - Purple for Cash Payments
- **Icon** representing the metric
- **Title** describing the metric
- **Value** formatted in Indonesian Rupiah (IDR)

### Data Flow
```
filteredOrders (from OrderHistoryOptimized)
  ↓
PaymentSummaryCards component
  ↓
useMemo calculation (metrics)
  ↓
Format currency (IDR)
  ↓
Render carousel with cards
```

### Filter Integration
The summary cards automatically update when any filter changes:
- Execution Status filter
- Payment Status filter
- Payment Method filter
- Date Range filter (today, yesterday, week, month)
- Search term filter
- Overdue orders filter

All filters are applied to the orders before being passed to PaymentSummaryCards, ensuring the metrics always reflect the current view.

## Technical Implementation

### Key Dependencies
```json
{
  "embla-carousel-react": "^8.3.0",
  "lucide-react": "icons library",
  "@tanstack/react-query": "data fetching"
}
```

### Component Props
```typescript
interface PaymentSummaryCardsProps {
  orders: Order[];  // Filtered orders from parent component
}
```

### Order Type
```typescript
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_status: string;  // 'completed' | 'pending' | 'down_payment'
  payment_method?: string;  // 'cash' | 'qris' | 'transfer'
  payment_amount?: number;
  // ... other fields
}
```

## Performance Optimizations
1. **useMemo**: Payment calculations are memoized to prevent unnecessary recalculations
2. **Lazy Loading**: Carousel library uses lazy loading for better performance
3. **Minimal Re-renders**: Component only re-renders when orders array changes

## Testing Considerations
To test this feature:
1. Login as owner (role: 'laundry_owner')
2. Navigate to Order History (/order-history)
3. Verify cards appear above the orders list
4. Test different filters and verify metrics update correctly
5. Test on different screen sizes for responsive behavior
6. Login as staff to verify cards are hidden

## Future Enhancements (Optional)
- Add transfer payment breakdown card
- Add date comparison (vs previous period)
- Add percentage indicators
- Export summary as PDF/Excel
- Add trend charts below cards

## Files Modified
1. `src/components/orders/PaymentSummaryCards.tsx` (new file)
2. `src/pages/OrderHistoryOptimized.tsx` (import and integration)

## Build & Deploy
```bash
# Build the project
npm run build

# Run development server
npm run dev

# Lint check
npm run lint
```

All builds successful ✅
No new linting errors ✅

## Accessibility
- Carousel supports keyboard navigation (arrow keys)
- Cards have appropriate ARIA labels
- High contrast colors for readability
- Mobile swipe gestures supported

## Browser Support
Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes
- Transfer payments are included in "Total Paid" but not shown separately (only QRIS and Cash have dedicated cards)
- Currency formatting uses Indonesian locale ('id-ID')
- The feature respects the existing multi-tenant architecture
- Store context is properly maintained
