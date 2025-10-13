# Payment Summary Cards - Visual Guide

## Component Location
The Payment Summary Cards appear on the **Order History** page (`/order-history`), positioned:
- ✅ **Above** the orders list
- ✅ **Below** the search and filter controls
- ✅ **Visible only** to users with "owner" role

## Card Layout

### Mobile View (< 640px)
```
┌─────────────────────────────────────────┐
│  [Search Bar]              [Filter ▼]   │
└─────────────────────────────────────────┘

┌───────────────────────┐  ┌───────────┐
│ 💰 Total Dibayar      │  │ 🕐 Total │
│                       │  │   Pending │
│ Rp 5,250,000         │  │           │
│                       │  │ Rp 1,500  │
└───────────────────────┘  └───────────┘
         ← Swipe to see more cards →

┌─────────────────────────────────────────┐
│         Order List Table                │
│  ┌─────────────────────────────────┐   │
│  │ Customer Name     | Status      │   │
│  │ John Doe         | Paid        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Mobile Behavior:**
- Shows ~85% of card width at a time
- Shows 2 cards with slight overlap
- Smooth swipe gestures to navigate
- No navigation arrows (gesture-based)
- Cards: Total Dibayar, Total Pending (visible)
- Swipe left to see: Dibayar QRIS, Dibayar Tunai

### Tablet View (640px - 1024px)
```
┌───────────────────────────────────────────────────────────┐
│  [Search Bar]                         [Filter ▼]          │
└───────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│ 💰 Total Dibayar        │  │ 🕐 Total Pending        │
│                         │  │                         │
│ Rp 5,250,000           │  │ Rp 1,500,000           │
└─────────────────────────┘  └─────────────────────────┘
              ← Swipe to see more →

┌───────────────────────────────────────────────────────────┐
│                  Order List Table                         │
└───────────────────────────────────────────────────────────┘
```

**Tablet Behavior:**
- Shows 2 full cards (50% width each)
- Swipe to see the other 2 cards
- Better spacing and padding
- Still gesture-based navigation

### Desktop View (> 1024px)
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Search Bar]                                      [Filter ▼]        │
└─────────────────────────────────────────────────────────────────────┘

 ◄  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  ►
    │💰 Total Dibayar│ │🕐 Total Pending│ │🔷 Dibayar QRIS │ │💵 Dibayar Tunai│
    │                │ │                │ │                │ │                │
    │ Rp 5,250,000   │ │ Rp 1,500,000   │ │ Rp 2,100,000   │ │ Rp 3,150,000   │
    └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         Order List Table                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Desktop Behavior:**
- Shows all 4 cards at once (25% width each)
- Navigation arrows visible (◄ ►) for keyboard/mouse control
- Hover effects on cards (shadow lift)
- Better spacing and larger text

## Card Details

### Card 1: Total Dibayar (Total Paid)
- **Color**: Green theme
- **Icon**: 💰 Wallet
- **Background**: Light green (`bg-green-50`)
- **Value Color**: Dark green (`text-green-700`)
- **Calculation**: Sum of all orders with `payment_status === 'completed'`

### Card 2: Total Pending
- **Color**: Orange theme
- **Icon**: 🕐 Clock
- **Background**: Light orange (`bg-orange-50`)
- **Value Color**: Dark orange (`text-orange-700`)
- **Calculation**: 
  - Pending orders: full amount
  - Down payment orders: remaining balance only

### Card 3: Dibayar QRIS (QRIS Payments)
- **Color**: Blue theme
- **Icon**: 🔷 QR Code
- **Background**: Light blue (`bg-blue-50`)
- **Value Color**: Dark blue (`text-blue-700`)
- **Calculation**: Sum of completed orders paid via QRIS

### Card 4: Dibayar Tunai (Cash Payments)
- **Color**: Purple theme
- **Icon**: 💵 Banknote
- **Background**: Light purple (`bg-purple-50`)
- **Value Color**: Dark purple (`text-purple-700`)
- **Calculation**: Sum of completed orders paid via cash

## Card Structure (Each Card)
```
┌──────────────────────────────────────────┐
│  Title (small text)          [Icon]     │
│                              ┌────┐      │
│  Value (large, bold)        │ 💰  │     │
│  Rp X,XXX,XXX               └────┘      │
└──────────────────────────────────────────┘
```

**Elements:**
1. **Title**: Small, gray text (e.g., "Total Dibayar")
2. **Value**: Large, bold, colored text with Indonesian Rupiah format
3. **Icon**: Rounded background with white ring, matching theme color

## Interactive Behavior

### Filter Integration
When any filter changes, cards update automatically:

```
User applies filter: "Today" + "Completed"
              ↓
filteredOrders updates in parent component
              ↓
PaymentSummaryCards receives new orders array
              ↓
useMemo recalculates metrics
              ↓
Cards re-render with updated values
```

### Example Scenarios

#### Scenario 1: All Orders
- Shows total across all orders
- All 4 cards display complete sums

#### Scenario 2: Filter by "Today"
- Cards show only today's payment data
- Values decrease to reflect single day

#### Scenario 3: Filter by "QRIS" payment method
- Total Paid shows only QRIS payments
- "Dibayar QRIS" matches "Total Dibayar"
- "Dibayar Tunai" shows Rp 0

#### Scenario 4: Filter by "Pending" status
- "Total Dibayar" shows Rp 0
- "Total Pending" shows all pending amounts
- QRIS and Cash cards show Rp 0

## Access Control

### Owner Role
```
User: { role: 'laundry_owner', ... }
              ↓
isOwner = true
              ↓
Cards are VISIBLE ✓
```

### Staff Role
```
User: { role: 'staff', ... }
              ↓
isOwner = false
              ↓
Cards are HIDDEN ✗
(Component returns null)
```

## Currency Formatting
All amounts use Indonesian locale formatting:
- Format: `Rp X,XXX,XXX`
- Locale: `'id-ID'`
- Currency: `'IDR'`
- No decimal places

Examples:
- `1500000` → `Rp 1.500.000`
- `250000` → `Rp 250.000`
- `0` → `Rp 0`

## Responsive Breakpoints
```css
Mobile:   < 640px   (basis-[85%])
Tablet:   640-1024  (basis-1/2)
Desktop:  > 1024px  (basis-1/4)
```

## Technical Notes
- Uses Embla Carousel for smooth sliding
- Performance optimized with `useMemo`
- Zero layout shift on load
- Touch-friendly tap targets
- Keyboard accessible (arrow keys work on desktop)
- ARIA labels for screen readers

## Color Palette
```
Green:  #f0fdf4 (bg) / #15803d (text) / #16a34a (icon)
Orange: #fff7ed (bg) / #c2410c (text) / #ea580c (icon)
Blue:   #eff6ff (bg) / #1d4ed8 (text) / #2563eb (icon)
Purple: #faf5ff (bg) / #7e22ce (text) / #9333ea (icon)
```

## Shadow & Effects
- Default: `shadow-md`
- Hover: `shadow-lg` (desktop only)
- Transition: `transition-shadow`
- Ring: White ring around icon for contrast

## Accessibility Features
- ✅ Semantic HTML structure
- ✅ ARIA labels on carousel
- ✅ Keyboard navigation support
- ✅ High contrast colors (WCAG AA)
- ✅ Touch targets > 44px
- ✅ Focus indicators
- ✅ Screen reader friendly

## Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 8+)
