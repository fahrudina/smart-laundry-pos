
# Prompt: Create User Management Feature for Smart Laundry POS System

## Project Context
You are working on an existing Smart Laundry POS system located in `/Users/macbookpro/play/smart-laundry-pos` with the following current structure:

### Current Tech Stack
- **Frontend**: Next.js 14+ with TypeScript
- **Backend**: Supabase (PostgreSQL database, Auth, Real-time)
- **Styling**: Tailwind CSS
- **UI Components**: Likely using shadcn/ui or similar component library
- **Authentication**: Supabase Auth already implemented

### Existing Project Structure
smart-laundry-pos/ ├── src/ │ ├── app/ # Next.js App Router │ ├── components/ # React components │ ├── lib/ # Utilities and configurations │ ├── types/ # TypeScript type definitions │ └── hooks/ # Custom React hooks ├── supabase/ # Supabase configuration and migrations ├── public/ # Static assets └── package.json # Dependencies and scripts

### Current Database Models (Analyze and extend these)
- `users` table (with basic auth)
- `customers` table 
- `orders` table
- Existing authentication system

### Current Features
- User authentication
- Customer management
- Order processing
- Basic POS functionality

## New Feature Requirements

### Multi-Tenant User Management System

#### User Hierarchy & Roles
1. **Laundry Owner** (new role)
   - Can create and manage multiple stores
   - Can create staff accounts for their stores
   - Full access to all data within their stores
   - Dashboard showing all stores performance

2. **Staff** (enhanced existing role)
   - Must be assigned to ONE specific store
   - Can only see/manage data from their assigned store
   - Can add customers to their store
   - Can process orders for their store only

3. **Customer** (enhanced existing role)
   - Belongs to the store where they were registered
   - Only visible to staff/owner of that store
   - Orders tied to their store

#### Data Isolation (Multi-Tenancy)
- **Store-level data separation**: All data must be scoped to stores
- **Orders**: Only accessible by users from the same store
- **Customers**: Only visible to staff/owner of the store they belong to
- **Cross-store data leakage prevention**: Strict RLS policies

## Technical Implementation Requirements

### 1. Database Schema Updates
- Analyze existing schema in `supabase/` folder
- Create `stores` table with proper relationships
- Add `store_id` foreign keys to existing tables (users, customers, orders)
- Update user roles enum to include 'laundry_owner'
- Implement Row Level Security (RLS) policies for multi-tenancy

### 2. Type System Updates
- Update TypeScript types in `src/types/` to reflect new schema
- Add store-related interfaces and enums
- Update existing types with store associations

### 3. API Layer Enhancement
- Extend Supabase client in `src/lib/` with store-aware queries
- Create store management functions
- Update existing API calls to include store filtering
- Add role-based authorization helpers

### 4. Frontend Components
**New Components Needed:**
- Store management dashboard (for owners)
- Staff management interface (for owners)
- Store selector/context provider
- Role-based navigation wrapper

**Components to Update:**
- Customer listing (add store filtering)
- Order management (add store scoping)
- User profile (add store information)
- Navigation (role-based menu items)

### 5. Authentication & Authorization
- Extend current auth system with role checking
- Add store context to user sessions
- Create middleware for route protection based on roles
- Implement store-level permission checking

### 6. State Management
- Add store context to React Context or state management
- Update existing hooks to be store-aware
- Create hooks for store management operations

## Implementation Guidelines

### Code Standards
- Follow existing code patterns and conventions in the project
- Use TypeScript strictly (extend existing type patterns)
- Maintain consistency with current component structure
- Follow existing naming conventions for files and functions

### File Organization
- Place new components in appropriate `src/components/` subdirectories
- Add new types to `src/types/`
- Extend existing utility functions in `src/lib/`
- Follow current folder structure patterns

### Database Migrations
- Create migration files in `supabase/migrations/`
- Follow existing migration naming conventions
- Include proper rollback procedures

### Security Considerations
- Implement proper RLS policies
- Add input validation and sanitization
- Ensure no data leakage between stores
- Add proper error handling without exposing sensitive data

## Deliverables

1. **Database Layer**
   - Migration files for schema updates
   - RLS policies implementation
   - Updated seed data (if applicable)

2. **Backend Integration**
   - Updated Supabase client functions
   - New API helper functions for store operations
   - Enhanced authentication utilities

3. **Frontend Implementation**
   - New React components for store/staff management
   - Updated existing components with store awareness
   - Role-based routing and navigation
   - Store context provider

4. **Type Safety**
   - Updated TypeScript interfaces
   - New type definitions for store operations
   - Enhanced existing types

5. **Documentation**
   - API documentation for new endpoints
   - Component usage examples
   - Database schema documentation

## Implementation Order
1. Analyze current codebase structure and patterns
2. Create database schema updates and migrations
3. Update TypeScript types and interfaces
4. Implement backend API functions
5. Create/update frontend components
6. Add authentication and authorization layers
7. Test the complete flow
8. Add documentation

Please analyze the existing codebase first, then implement this feature following the established patterns and maintaining backward compatibility where possible.