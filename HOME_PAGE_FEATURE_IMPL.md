## AI Agent Prompt: Implement Smart Laundry POS Home Page (Multi-Tenant)

**Goal:**  
Create the Home Page UI for the Smart Laundry POS system, as shown in the attached screenshot, fully integrated with the multi-tenant architecture described in `MULTI_TENANT_IMPLEMENTATION.md`.

---

### Requirements

1. **Dashboard Overview**
   - Show cards for Orders, Revenue, Customers, and Pending.
   - Each card displays current value, % change from yesterday, and an icon.
   - Data must be filtered by the current store context (from `StoreContext`).
   - Owners see data for the selected store; staff see only their assigned store.

2. **Quick Actions**
   - Buttons for: New Order, Find Customer, Order History, Reports (changes Reports with New Customer and integrate with current functionality).
   - Each button navigates to the corresponding feature/page already implemented.
   - Navigation and permissions must respect user role (owner/staff).

3. **Recent Orders**
   - List recent orders for the current store.
   - Show customer name, service type, status, and time.
   - Data must be filtered by store and role.

4. **Header**
   - Show app name, logged-in user, current date/time.
   - Display store selector (for owners) and user avatar.
   - Store selector must use the existing `StoreSelector` component.

5. **Authentication Flow**
   - After successful login, redirect user to this Home Page.

6. **Integration**
   - All data fetching must use hooks that filter by current store (e.g., `useOrders`, `useCustomers`).
   - Use `StoreContext` for store state.
   - Use role-based navigation and permissions as described in the implementation doc.

7. **Design**
   - Match the layout, colors, and style of the attached screenshot in ./attached/homepage.png.
   - Use modular components for each section (Overview, Quick Actions, Recent Orders, Header).
   - Ensure responsiveness and accessibility.

---

### Technical Notes

- Use the existing multi-tenant state management and RLS policies.
- Owners can switch stores and see data for the selected store.
- Staff are limited to their assigned store and cannot access store management.
- Use existing navigation and state management patterns.
- Reuse and compose from existing components where possible.

---

**Deliverable:**  
A fully functional Home Page component (and subcomponents if needed) that meets the above requirements and integrates with the current multi-tenant backend and