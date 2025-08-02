// Additional types for multi-tenant store system
export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtendedUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'staff' | 'laundry_owner';
  store_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreWithOwnershipInfo {
  store_id: string;
  store_name: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  is_owner: boolean;
  is_active: boolean;
}

export interface StoreContextType {
  currentStore: StoreWithOwnershipInfo | null;
  userStores: StoreWithOwnershipInfo[];
  isOwner: boolean;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
}

export interface CreateStoreData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface AssignStaffData {
  staff_user_id: string;
  store_id: string;
}

// Enhanced customer and order types with store association
export interface CustomerWithStore {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithStore {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  store_id: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'staff' | 'laundry_owner';

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  store_id?: string;
}

export interface StoreStats {
  total_orders: number;
  total_revenue: number;
  active_customers: number;
  pending_orders: number;
}
