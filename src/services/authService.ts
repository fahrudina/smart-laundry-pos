import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'staff' | 'laundry_owner';
  store_id?: string;
  is_active: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
  expires_at: number;
}

class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;

  private constructor() {
    // Load session from localStorage on initialization
    this.loadSession();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem('auth_session', JSON.stringify(session));
    this.session = session;
  }

  private loadSession(): void {
    try {
      const stored = localStorage.getItem('auth_session');
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        // Check if session is still valid
        if (Date.now() < session.expires_at) {
          this.session = session;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('auth_session');
    this.session = null;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async signUp(email: string, password: string, fullName?: string, phone?: string, role: 'staff' | 'laundry_owner' = 'staff', storeData?: { name: string; address?: string; phone?: string; }): Promise<User> {
    try {
      const { data, error } = await supabase.rpc('create_user', {
        user_email: email,
        user_password: password,
        user_full_name: fullName || null,
        user_phone: phone || null,
        user_role: role
      });

      if (error) {
        throw new Error(error.message);
      }

      // Fetch the created user
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, store_id, is_active')
        .eq('id', data)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      let storeId = userData.store_id;

      // If owner signup and store data provided, create store (owner_id will be set by RPC)
      // Note: For owners, we keep users.store_id NULL and track ownership via stores.owner_id
      if (role === 'laundry_owner' && storeData && storeData.name) {
        try {
          console.log('Creating store for owner:', userData.id, 'with data:', storeData);
          // createStoreForUser RPC will set stores.owner_id = userData.id
          const newStoreId = await this.createStoreForUser(userData.id, storeData);
          console.log('Store created successfully with ID:', newStoreId);
          // Do NOT update users.store_id for owners - keep it null per multi-tenant design
        } catch (storeError) {
          // If store creation fails, remove the created user record to avoid orphan
          try {
            await supabase.from('users').delete().eq('id', userData.id);
          } catch (cleanupErr) {
            console.error('Cleanup failed after store creation failure:', cleanupErr);
          }
          throw new Error(storeError instanceof Error ? storeError.message : String(storeError));
        }
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role as 'staff' | 'laundry_owner',
        store_id: storeId,
        is_active: userData.is_active
      };

      // Create session
      const session: AuthSession = {
        user,
        token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      this.saveSession(session);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data, error } = await supabase.rpc('verify_user_credentials', {
        user_email: email,
        user_password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Invalid email or password');
      }

      const userData = data[0];
      
      // Get store_id from users table
      const { data: userStoreData } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userData.user_id)
        .single();
      
      const user: User = {
        id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role as 'staff' | 'laundry_owner',
        store_id: userStoreData?.store_id,
        is_active: userData.is_active
      };

      // Create session
      const session: AuthSession = {
        user,
        token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      this.saveSession(session);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  signOut(): void {
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.session?.user || null;
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return this.session !== null && Date.now() < this.session.expires_at;
  }

  // Store management methods
  private async createStoreForUser(userId: string, storeData: { name: string; address?: string; phone?: string; }): Promise<string> {
    console.log('createStoreForUser: calling RPC with params:', {
      user_id: userId,
      store_name: storeData.name,
      store_description: `Store owned by user`,
      store_address: storeData.address ?? null,
      store_phone: storeData.phone ?? null,
      store_email: null
    });
    
    const { data, error } = await supabase.rpc('create_store', {
      user_id: userId,
      store_name: storeData.name,
      store_description: `Store owned by user`,
      store_address: storeData.address ?? null,
      store_phone: storeData.phone ?? null,
      store_email: null
    });

    if (error) {
      console.error('createStoreForUser: RPC error:', error);
      throw new Error(error.message);
    }

    console.log('createStoreForUser: RPC returned data:', data);
    // RPC returns the created store UUID
    return data as string;
  }

  async createStore(storeData: {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
  }): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('create_store', {
      user_id: this.session!.user.id,
      store_name: storeData.name,
      store_description: storeData.description,
      store_address: storeData.address,
      store_phone: storeData.phone,
      store_email: storeData.email
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async assignStaffToStore(staffUserId: string, storeId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('assign_staff_to_store', {
      user_id: this.session!.user.id,
      staff_user_id: staffUserId,
      target_store_id: storeId
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getUserStores() {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    console.log('getUserStores: calling RPC with user_id:', this.session!.user.id);
    const { data, error } = await supabase.rpc('get_user_stores', {
      user_id: this.session!.user.id
    });

    if (error) {
      console.error('getUserStores: RPC error:', error);
      throw new Error(error.message);
    }

    console.log('getUserStores: RPC returned data:', data);
    return data;
  }

  isOwner(): boolean {
    return this.session?.user.role === 'laundry_owner';
  }

  isStaff(): boolean {
    return this.session?.user.role === 'staff';
  }

  hasStoreAccess(storeId: string): boolean {
    if (!this.session) return false;
    
    const user = this.session.user;
    if (user.role === 'laundry_owner') return true; // Owners can access all their stores
    
    return user.store_id === storeId; // Staff can only access their assigned store
  }
}

export const authService = AuthService.getInstance();
