// Migration Plan: Service Duration Types Implementation
// This document outlines the step-by-step migration strategy for production

## 🎯 Migration Strategy Overview

### Goals:
1. ✅ Zero downtime deployment
2. ✅ Preserve all existing data
3. ✅ Maintain backward compatibility
4. ✅ Gradual feature rollout
5. ✅ Easy rollback if needed

## 📋 Migration Phases

### Phase 1: Database Schema (COMPLETED)
- ✅ Add service_duration_types table
- ✅ Add optional columns to order_items
- ✅ Add base_price columns to services
- ✅ Migrate existing service durations to duration types
- ✅ Preserve all existing data

### Phase 2: Backend Compatibility Layer (NEXT)

#### 2.1 Create New Hooks (Additive)
```typescript
// New file: src/hooks/useDurationTypes.ts
export const useDurationTypes = () => { ... }
export const useCreateDurationType = () => { ... }
export const useUpdateDurationType = () => { ... }
```

#### 2.2 Update Service Hooks (Backward Compatible)
```typescript
// Modified: src/hooks/useServices.ts
export interface ServiceData {
  // Keep all existing fields
  duration_value: number;        // Keep for backward compatibility
  duration_unit: 'hours' | 'days'; // Keep for backward compatibility
  
  // Add new fields
  base_unit_price?: number;      // New base pricing
  base_kilo_price?: number;      // New base pricing
}
```

#### 2.3 Enhanced Order Creation (Feature Flag)
```typescript
// Modified: src/hooks/useOrdersOptimized.ts
// Add feature flag to use new or old flow
const USE_DURATION_TYPES = process.env.VITE_USE_DURATION_TYPES === 'true';

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      if (USE_DURATION_TYPES) {
        // New flow with duration type selection
        return createOrderWithDurationTypes(orderData);
      } else {
        // Existing flow (unchanged)
        return createOrderLegacy(orderData);
      }
    }
  });
};
```

### Phase 3: UI Components (Progressive Enhancement)

#### 3.1 Create New Components (Additive)
```typescript
// New file: src/components/pos/DurationTypeSelector.tsx
// New file: src/components/pos/ServiceWithDurationPOS.tsx
// New file: src/pages/DurationTypeManagement.tsx
```

#### 3.2 Enhanced POS (Feature Flag)
```typescript
// Modified: src/components/pos/EnhancedLaundryPOS.tsx
const USE_DURATION_SELECTION = process.env.VITE_USE_DURATION_SELECTION === 'true';

export const EnhancedLaundryPOS = () => {
  if (USE_DURATION_SELECTION) {
    return <ServiceWithDurationPOS />;
  }
  
  // Return existing component (unchanged)
  return <ExistingPOSLogic />;
};
```

### Phase 4: Gradual Rollout Strategy

#### 4.1 Internal Testing (Week 1)
```bash
# Enable for internal testing only
VITE_USE_DURATION_TYPES=true
VITE_USE_DURATION_SELECTION=true
```

#### 4.2 Beta Stores (Week 2)
```typescript
// Feature flag by store
const enabledStores = ['store-uuid-1', 'store-uuid-2'];
const isNewFlowEnabled = enabledStores.includes(currentStore?.store_id);
```

#### 4.3 Gradual Production Rollout (Week 3-4)
```typescript
// Percentage-based rollout
const rolloutPercentage = 50; // Start with 50%
const isNewFlowEnabled = hashStoreId(currentStore.store_id) % 100 < rolloutPercentage;
```

#### 4.4 Full Production (Week 5)
```typescript
// Enable for all stores
const USE_DURATION_TYPES = true;
```

## 🔄 Deployment Sequence

### Day 1: Database Migration
```bash
# 1. Apply database migration
npm run build
# 2. Deploy with feature flags OFF
VITE_USE_DURATION_TYPES=false
VITE_USE_DURATION_SELECTION=false
```

### Day 2-7: Internal Testing
```bash
# Deploy with internal testing enabled
VITE_USE_DURATION_TYPES=true
VITE_USE_DURATION_SELECTION=true
VITE_INTERNAL_TESTING=true
```

### Day 8-14: Beta Testing
```bash
# Deploy with beta stores enabled
VITE_BETA_STORES=store1,store2,store3
```

### Day 15+: Production Rollout
```bash
# Gradual rollout with monitoring
VITE_ROLLOUT_PERCENTAGE=25  # Week 1
VITE_ROLLOUT_PERCENTAGE=50  # Week 2  
VITE_ROLLOUT_PERCENTAGE=75  # Week 3
VITE_ROLLOUT_PERCENTAGE=100 # Week 4
```

## 📊 Data Migration Results

After running the migration script, each store will have:

1. **Standard Duration Types Created**:
   - Express (6 hours or 1 day) - 1.5x price multiplier
   - Standard (2 days) - 1.0x price multiplier  
   - Economy (3+ days) - 0.8x price multiplier

2. **Existing Services Preserved**:
   - All current service data intact
   - Base prices copied from current prices
   - Duration information preserved for backward compatibility

3. **Order History Intact**:
   - All existing orders remain unchanged
   - New orders can use either old or new flow

## 🛡️ Rollback Strategy

If issues are detected, rollback is simple:

```bash
# 1. Immediate rollback via feature flags
VITE_USE_DURATION_TYPES=false
VITE_USE_DURATION_SELECTION=false

# 2. System continues working exactly as before
# 3. New database columns remain but unused
# 4. No data loss occurs
```

## 🔍 Testing Checklist

### Database Migration Testing
- [ ] Migration script runs without errors
- [ ] All existing services preserved
- [ ] Duration types created correctly
- [ ] RLS policies working
- [ ] Performance acceptable

### Application Testing  
- [ ] Existing POS flow unchanged
- [ ] New duration selection works
- [ ] Order creation with both flows
- [ ] Service management compatibility
- [ ] Receipt generation works

### Production Validation
- [ ] Monitor error rates
- [ ] Check order completion rates
- [ ] Validate WhatsApp notifications
- [ ] Verify receipt printing
- [ ] Test mobile responsiveness

## 📈 Success Metrics

- ✅ Zero downtime during deployment
- ✅ No existing orders affected
- ✅ All existing customers can continue service
- ✅ Store owners can gradually adopt new features
- ✅ Easy rollback if any issues detected

## 🚀 Implementation Timeline

| Week | Activity | Status |
|------|----------|---------|
| 1 | Database migration + Feature flags | Ready |
| 2 | Internal testing + Bug fixes | Pending |
| 3 | Beta store testing | Pending |
| 4 | 25% production rollout | Pending |
| 5 | 50% production rollout | Pending |
| 6 | 75% production rollout | Pending |
| 7 | 100% production rollout | Pending |
| 8 | Remove feature flags + Cleanup | Pending |

This migration strategy ensures your production service continues running smoothly while gradually introducing the new duration type system.
