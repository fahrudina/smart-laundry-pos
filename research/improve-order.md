# Add Service Type Selection to Order Creation

I need to enhance the order creation functionality in a React TypeScript laundry POS system to support three different service types:

1. **By Unit** - Customer selects specific items with quantities (e.g., 5 shirts, 3 pants)
2. **By Kilo** - Customer specifies weight in kilograms (e.g., 2.5 kg)
3. **Combine Kilo and Unit** - Customer can specify both weight and individual items

## Current Structure

The system uses:
- Supabase for backend
- React Query for data management
- TypeScript for type safety
- Current order creation hook: `useCreateOrder`

## Requirements

### 1. Update Data Types
Modify the existing interfaces to support service types:

```typescript
interface OrderItem {
  service_name: string;
  service_price: number;
  quantity: number;
  line_total: number;
  estimated_completion?: string;
  service_type: 'unit' | 'kilo' | 'combined'; // NEW
  weight_kg?: number; // NEW - for kilo-based services
  unit_items?: UnitItem[]; // NEW - for combined services
}

interface UnitItem {
  item_name: string;
  quantity: number;
  price_per_unit: number;
}
```

2. UI Components Needed
Create components for:

Service type selector (radio buttons or dropdown)
Weight input field (for kilo services)
Dynamic unit item selector with add/remove functionality
Combined view showing both weight and unit items
Price calculation that handles all service types
3. Business Logic
By Unit: Calculate total based on individual item quantities × unit prices
By Kilo: Calculate total based on weight × price per kg
Combined: Calculate total as (weight × kg_price) + (sum of unit_items)
4. Form Validation
Ensure at least one service type has valid input
Validate weight is positive number for kilo services
Validate unit quantities are positive integers
Ensure all required fields are filled based on selected service type
5. Database Schema Updates
Update the order_items table to support:

service_type field
weight_kg field (nullable)
unit_items JSON field (nullable)
6. Integration Points
Update the existing useCreateOrder mutation
Maintain backward compatibility with existing orders
Update order display components to show service type information
Ensure proper data serialization for Supabase storage

##Expected Output
Updated TypeScript interfaces
React components for service type selection
Modified create order mutation
Database migration script (if needed)
Updated order display to show service type details

## Context Files
The main hook is in useOrdersOptimized.ts and contains the current order creation logic. Please maintain the existing patterns and error handling while adding the new functionality.