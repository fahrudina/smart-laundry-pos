# Laundry Points System Implementation

## Overview
The laundry points system rewards customers with loyalty points for each transaction when payment is successfully completed. Points are awarded based on the quantity and type of service:
- **1 point per kilogram** for weight-based services (service_type: 'kilo')
- **1 point per unit** for unit-based services (service_type: 'unit')
- For combined services (service_type: 'combined'), both weight and unit points are awarded

## Database Schema

### customer_points Table
Tracks accumulated points for each customer at each store (multi-tenant support).

```sql
CREATE TABLE customer_points (
  id UUID PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(customer_phone, store_id)
);
```

### orders Table Enhancement
Added `points_earned` column to track points for each order.

```sql
ALTER TABLE orders ADD COLUMN points_earned INTEGER DEFAULT 0;
```

## Point Calculation Logic

Points are calculated based on `order_items`:

```typescript
// For kilo-based services
if (service_type === 'kilo' && weight_kg) {
  points += Math.round(weight_kg);  // 1 point per kg
}

// For unit-based services  
if (service_type === 'unit') {
  points += Math.ceil(quantity);  // 1 point per unit
}

// For combined services
if (service_type === 'combined') {
  if (weight_kg) points += Math.round(weight_kg);
  points += Math.ceil(quantity);
}
```

## Implementation Flow

### Order Creation with Points
1. Customer completes order with payment status 'paid'
2. Order and order_items are inserted into database
3. Points are calculated from order items
4. `orders.points_earned` is updated with calculated points
5. `customer_points` table is updated:
   - If customer exists: `total_points` += `points_earned`
   - If new customer: new record created with `points_earned`
6. WhatsApp notification is sent including points earned

### Code Location
- **Hook**: `src/hooks/useOrdersWithNotifications.ts` - `useCreateOrderWithNotifications()`
- **Database**: `supabase/migrations/20251101000000_create_customer_points_system.sql`
- **Types**: `src/integrations/whatsapp/types.ts` - `OrderCreatedData.pointsEarned`
- **Templates**: `src/integrations/whatsapp/templates.ts` - `orderCreated()` template

## WhatsApp Notification

When points are earned, the order creation notification includes:

```
====================
Status : Lunas
🎉 Selamat! Anda mendapatkan 5 poin laundry! 🎉
(1 poin per kg/unit)
====================
```

The points message only appears when:
- `payment_status === 'paid'`
- `pointsEarned > 0`

## Configuration

The system is automatically enabled and requires no configuration. Points are:
- Calculated immediately on successful payment
- Stored per customer per store
- Included in WhatsApp notifications (if WhatsApp is enabled)

## Future Enhancements

The system is designed to be extensible for:
- Variable point rates (e.g., 2 points per kg for premium services)
- Point redemption system
- Point expiration
- Promotional point multipliers
- Loyalty tiers based on total points

## Database Function

A SQL function `calculate_order_points(order_id)` is available for querying:

```sql
-- Get points for a specific order
SELECT calculate_order_points('order-uuid-here');

-- Recalculate all order points
UPDATE orders 
SET points_earned = calculate_order_points(id) 
WHERE payment_status = 'paid' AND points_earned IS NULL;
```

## Testing Points Calculation

To test the points system:

1. **Unit-based service**: Order 3 units → Earn 3 points
2. **Kilo-based service**: Order 2.5 kg → Earn 3 points (rounded)
3. **Combined service**: Order 2 kg + 3 units → Earn 5 points
4. **Pending payment**: No points awarded until payment is marked 'paid'

## Multi-tenant Support

Points are isolated per store:
- Each customer can have different point balances at different stores
- Points earned at Store A don't affect balance at Store B
- Managed via `customer_points.store_id` foreign key
