# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies (takes ~20 seconds)
npm install

# Start development server (ready in ~270ms, available at http://localhost:8080/)
npm run dev

# Build for production (takes ~9 seconds) - NEVER CANCEL
npm run build

# Build in development mode (includes source maps)
npm run build:dev

# Preview production build (available at http://localhost:4173/)
npm run preview

# Run linter (takes ~3 seconds, expect existing errors)
npm run lint
```

### Critical Timeout Settings
- Set timeouts to at least 60 seconds for `npm install`
- Set timeouts to at least 30 seconds for `npm run build`
- NEVER CANCEL builds or installations - wait for completion

### Testing Individual Components
There is no test suite configured. Test changes by:
1. Running `npm run dev` and verifying in browser
2. Testing specific workflows (create order, process payment, etc.)
3. Checking browser console for errors
4. Running `npm run build` to catch TypeScript errors

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 5.4
- **UI Components**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **State Management**: React Query (@tanstack/react-query) + Context API
- **Authentication**: Custom auth service using Supabase (localStorage-based sessions)
- **PWA**: Service Worker + Web App Manifest (offline support)
- **Routing**: React Router v6

### Multi-Tenant Architecture

This is a **multi-tenant POS system** where:
- **Stores** are the primary tenant boundary (`stores` table)
- **Owners** (`laundry_owner` role) can own multiple stores
- **Staff** (`staff` role) are assigned to a specific store via `users.store_id`
- **All data** (customers, orders, services) is scoped to a store via `store_id`

**Key Context Providers** (in `src/contexts/`):
1. **AuthContext**: Manages user authentication and sessions
   - Uses custom `authService` (NOT Supabase Auth)
   - Sessions stored in localStorage with expiration
   - User roles: `staff` or `laundry_owner`

2. **StoreContext**: Manages multi-tenant store switching
   - Tracks current active store for operations
   - `isOwner` determined by current store's ownership, not global role
   - Persists selected store in localStorage
   - **Critical**: Always use `currentStore.store_id` for data operations
   - Staff can only access their assigned store
   - Owners can switch between owned stores

3. **ThermalPrinterContext**: Manages thermal printer integration

### Database Schema Overview

**Core Tables**:
- `users`: User accounts with role-based access (staff/laundry_owner)
- `stores`: Store/business entities (owner_id references users)
- `customers`: Customer records (store-scoped via store_id)
- `orders`: Order records with dual status tracking
- `order_items`: Individual line items in orders
- `services`: Service definitions (store-scoped)
- `points`: Customer loyalty points (store-scoped, linked by customer_phone)
- `point_transactions`: Point earning/redemption history

**Dual Status System** (`orders` table):
- `execution_status`: Order fulfillment (in_queue, in_progress, ready_for_pickup, completed, cancelled)
- `payment_status`: Payment tracking (pending, completed, down_payment, refunded)

**Points System**:
- Points calculated as: 1 point per KG (rounded) or 1 point per unit
- Function: `calculate_order_points(order_id)` computes points from order items
- Points linked to customers via phone number (`points.customer_phone`)
- Tracks both `accumulated_points` (lifetime) and `current_points` (available)

### File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (DO NOT modify unless necessary)
│   ├── pos/             # POS-specific components (service selectors, order dialogs)
│   ├── orders/          # Order management components (virtualized lists, payment cards)
│   ├── dashboard/       # Dashboard widgets and cards
│   ├── stores/          # Store management (staff assignments, settings)
│   ├── auth/            # Auth components (ProtectedRoute, OwnerRoute)
│   ├── layout/          # Layout components (AppLayout, AppHeader)
│   ├── thermal/         # Thermal printer components
│   └── settings/        # Settings components (WhatsApp configuration)
├── contexts/            # React Context providers (Auth, Store, ThermalPrinter)
├── hooks/               # Custom React hooks
│   ├── useOrders.ts           # Order operations with WhatsApp notifications
│   ├── useOrdersOptimized.ts  # Optimized order fetching with pagination
│   ├── useCustomers.ts        # Customer CRUD operations
│   ├── useServices.ts         # Service management
│   └── useDashboard.ts        # Dashboard metrics
├── integrations/
│   ├── supabase/        # Supabase client and types (auto-generated types.ts)
│   └── whatsapp/        # WhatsApp integration (client, service, templates)
├── lib/                 # Utility libraries (utils, queryClient, printUtils)
├── pages/               # Route components (HomePage, OrderHistory, ServiceManagement, etc.)
├── services/            # Business logic services (authService)
├── types/               # TypeScript type definitions (multi-tenant types)
├── App.tsx              # Main app with route definitions
└── main.tsx             # Entry point with PWA service worker registration
```

### Critical Integration Points

**WhatsApp Integration** (`src/integrations/whatsapp/`):
- Optional feature controlled by environment variables
- Structure: `client.ts` (low-level API) → `service.ts` (notification service) → `templates.ts` (message formatting)
- Sends notifications for: order created, order completed, order ready for pickup
- Requires configuration in store settings
- Environment variables:
  ```
  VITE_WHATSAPP_ENABLED=true
  VITE_WHATSAPP_API_URL=your_api_url
  VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
  VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
  ```

**Supabase Integration**:
- Client configured in `src/integrations/supabase/client.ts` (DO NOT MODIFY)
- Database types auto-generated in `src/integrations/supabase/types.ts`
- Custom RPC functions:
  - `create_user(user_email, user_password, user_full_name, user_phone, user_role)`
  - `calculate_order_points(order_id_param)` - calculates points from order items
  - `get_public_receipt(order_id_param)` - fetches receipt for public display

**React Query Pattern**:
- All data fetching uses React Query hooks
- Query client configured in `src/lib/queryClient.ts`
- Invalidation keys follow pattern: `['entity', store_id, ...]`
- Example: `['orders', currentStore?.store_id]`, `['customers', currentStore?.store_id]`

### Route Structure and Protection

**Public Routes**:
- `/` - Landing page (SmartHomePage)
- `/login` - Authentication
- `/receipt/:orderId` - Public receipt view (no auth required)
- `/install` - PWA installation guide

**Protected Routes** (requires authentication):
- `/home` - Main dashboard (HomePage)
- `/pos` - Legacy POS interface (Index)
- `/order-history` - Order management (OrderHistoryOptimized)
- `/customers` - Customer management

**Owner-Only Routes** (requires `isOwner` from StoreContext):
- `/services` - Service management (ServiceManagement)
- `/stores` - Store management (StoreManagementPage)
- `/whatsapp-broadcast` - WhatsApp broadcast messaging

**Protection Components**:
- `<ProtectedRoute>`: Redirects to `/login` if not authenticated
- `<OwnerRoute>`: Shows error if user is not owner of current store
- `<ProtectedRedirect>`: Catch-all that redirects to appropriate page based on auth state

### Service Types System

The application supports three service types defined in the database:

1. **kilo**: Weight-based services (e.g., laundry by kilogram)
   - Uses `weight_kg` field
   - Pricing: `price_per_kg` × `weight_kg`
   - Points: 1 point per KG (rounded)

2. **unit**: Count-based services (e.g., shirts, shoes)
   - Uses `quantity` field
   - Pricing: `price_per_unit` × `quantity`
   - Points: 1 point per unit

3. **combined**: Hybrid services (both weight and count)
   - Uses both `weight_kg` and `quantity`
   - Pricing: `(price_per_kg × weight_kg) + (price_per_unit × quantity)`
   - Points: (KG rounded) + quantity

### PWA Features

- Service worker registered in `src/main.tsx`
- Manifest located at `public/manifest.json`
- Service worker script at `public/sw.js`
- Offline support with intelligent caching
- Install prompts handled by `usePWAInstall` hook
- PWA diagnostics available at `/install` route

### State Management Patterns

**Context-based state** (for global app state):
- Auth state (user, session)
- Store selection (currentStore, userStores)
- Thermal printer connection

**React Query** (for server state):
- All Supabase data fetching
- Automatic background refetching
- Optimistic updates for mutations
- Cache invalidation on mutations

**Local component state** (for UI state):
- Form inputs
- Dialog open/close states
- Temporary UI flags

## Common Development Tasks

### Adding a New Route
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx` with appropriate protection:
   ```tsx
   <Route
     path="/new-route"
     element={
       <ProtectedRoute>
         <AppLayout>
           <YourNewPage />
         </AppLayout>
       </ProtectedRoute>
     }
   />
   ```
3. Update navigation in `src/components/layout/AppHeader.tsx` if needed

### Working with Orders
- Use `useOrders` or `useOrdersOptimized` hook
- Always pass `currentStore?.store_id` to ensure store isolation
- Update both `execution_status` and `payment_status` as needed
- After creating/updating orders, invalidate queries: `['orders', store_id]`
- Points are calculated automatically when order items are inserted

### Working with Customers
- Use `useCustomers` hook
- Customers are store-scoped via `store_id`
- Phone numbers are the primary lookup key (also used for points)
- Always create/fetch customers with current store context

### Working with the Points System
- Points are automatically calculated and awarded in `useCreateOrderWithNotifications` hook
- Only awarded when `payment_status === 'paid'`
- SQL function `calculate_order_points(order_id)` available for manual calculations
- Points are linked to customers via `customer_phone`
- Points stored per customer per store in `points` table
- All transactions logged in `point_transactions` for audit trail

**Quick Reference:**
- See `POINTS_QUICK_REFERENCE.md` for code examples and common queries
- See `POINTS_DEPLOYMENT_GUIDE.md` for deployment instructions
- See `POINTS_UI_COMPONENTS.md` for UI component documentation
- Verify installation: Run `script/verify-points-tables.sql`

**UI Components:**
- `useCustomerPoints(customerPhone)` - Hook to fetch customer points
- `<CustomerPointsCard>` - Full points display card with statistics
- `<CustomerPointsBadge>` - Inline badge for tables/lists
- Integrated in: CustomersPage, PublicReceiptPage, OrderSuccessDialog

### Adding a New Database Table
1. Create migration file in `supabase/migrations/` with timestamp prefix
2. Include RLS policies appropriate for multi-tenant isolation
3. Add `store_id UUID REFERENCES stores(id)` for tenant scoping
4. Create indexes for `store_id` and frequently queried columns
5. Update `src/integrations/supabase/types.ts` (may require re-generation)

### Modifying Supabase Types
- Types are auto-generated in `src/integrations/supabase/types.ts`
- DO NOT manually edit this file
- Regenerate after schema changes (process TBD - check Supabase docs)

## Important Constraints

### Authentication
- Uses custom localStorage-based auth (NOT Supabase Auth)
- Session expiration handled in `authService`
- Always check `authService.isAuthenticated()` before operations
- User roles are NOT hierarchical (staff ≠ subset of owner permissions)

### Multi-Tenancy
- **ALWAYS** include `store_id` in queries for customers, orders, services
- **ALWAYS** use `currentStore?.store_id` from StoreContext
- Never query across stores unless user is owner viewing their stores
- RLS policies enforce store isolation at database level

### TypeScript Configuration
- `noImplicitAny: false` - allows implicit any types
- `strictNullChecks: false` - allows null/undefined without strict checking
- Linter shows many errors - focus on new code quality
- Existing `@typescript-eslint/no-explicit-any` errors are acceptable

### Build Warnings
- "browsers data (caniuse-lite) is 10 months old" - non-critical
- Chunk size warnings - already optimized with manual chunking
- These warnings are expected and can be ignored

### Known Limitations
- No automated test suite (manual testing required)
- No CI/CD configured
- Service worker may need manual unregister during development
- WhatsApp integration requires external API setup

## Database Migration Patterns

When creating migrations:
1. Use timestamp format: `YYYYMMDDHHMMSS_description.sql`
2. Always add comments explaining the purpose
3. Include rollback strategy if making destructive changes
4. Test with `store_id` filtering to ensure multi-tenant isolation
5. Add indexes for performance (especially on `store_id`, `created_at`)
6. Use `IF NOT EXISTS` for idempotent migrations

**Points System Migrations** (must be applied in order):
- `20251031000000_create_base_points_tables.sql` - Creates base `points` and `point_transactions` tables
- `20251101000000_create_customer_points_system.sql` - Enhances tables with multi-tenant support

Example migration pattern:
```sql
-- Add new feature to existing table
ALTER TABLE public.table_name ADD COLUMN new_column TYPE DEFAULT value;

-- Create index for performance
CREATE INDEX idx_table_name_new_column ON public.table_name(new_column);

-- Update RLS policy if needed
CREATE POLICY "policy_name" ON public.table_name
FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Add documentation
COMMENT ON COLUMN public.table_name.new_column IS 'Description of purpose';
```

## Troubleshooting

### Build Fails
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Retry: `npm run build`

### App Won't Start in Dev
1. Check port 8080 is not in use: `lsof -i :8080`
2. Verify dependencies: `npm install`
3. Check for TypeScript errors: `npm run lint`
4. Try clean start: kill dev server, clear browser cache, restart

### PWA Not Working
1. Check service worker registration in browser DevTools → Application
2. Verify `public/sw.js` is valid JavaScript
3. Verify `public/manifest.json` is valid JSON
4. HTTPS required in production for PWA features
5. Clear browser application storage and reload

### Store Context Issues
1. Check user is authenticated: verify in AuthContext
2. Check user has access to stores: `userStores` in StoreContext
3. Verify `currentStore` is set (auto-selected on login)
4. Check localStorage for `selected_store_id` persistence
5. Owners: verify `stores.owner_id` matches user ID
6. Staff: verify `users.store_id` is set correctly

### WhatsApp Not Sending
1. Verify environment variables are set
2. Check store settings for WhatsApp configuration
3. Test connection using store settings test button
4. Check browser console for API errors
5. Verify API credentials and URL

## Performance Optimization

### Current Optimizations
- Manual code splitting in `vite.config.ts` (vendor, ui, supabase, query, utils chunks)
- React Query caching reduces database calls
- Virtualized lists for large order/customer datasets (`VirtualizedOrderList`)
- Service worker caching for offline performance
- Optimized bundle with Terser minification

### When Adding Features
- Use React Query for server state (automatic caching/deduplication)
- Implement pagination for large datasets (see `useOrdersOptimized`)
- Use React.memo() for expensive re-renders
- Lazy load routes if bundle size increases significantly
- Test with network throttling in browser DevTools

## Code Style and Conventions

### Component Organization
- One component per file
- Export component as default for pages
- Use named exports for reusable components
- Keep components in appropriate subdirectories (pos/, orders/, stores/, etc.)

### Naming Conventions
- Components: PascalCase (e.g., `OrderDetailsDialog`)
- Hooks: camelCase with "use" prefix (e.g., `useOrders`)
- Utility functions: camelCase (e.g., `formatCurrency`)
- Types/Interfaces: PascalCase (e.g., `OrderWithItems`)
- Files: match component name (e.g., `OrderDetailsDialog.tsx`)

### Import Order
1. React and external libraries
2. UI components (@/components/ui)
3. Feature components (@/components/*)
4. Hooks (@/hooks)
5. Contexts (@/contexts)
6. Utilities and types (@/lib, @/types)
7. Relative imports

### Error Handling
- Use try/catch in async functions
- Show user-friendly error messages via toast notifications
- Log errors to console with context
- Never expose internal errors to users
