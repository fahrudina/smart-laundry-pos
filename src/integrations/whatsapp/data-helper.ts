import { supabase } from '@/integrations/supabase/client';
import { StoreInfo, OrderItem } from '@/integrations/whatsapp/types';

/**
 * Helper functions for WhatsApp notifications with database integration
 */
export class WhatsAppDataHelper {
  /**
   * Fetch store information from database
   */
  static async getStoreInfo(storeId?: string): Promise<StoreInfo> {
    try {
      console.log('🔍 Fetching store info for storeId:', storeId);
      
      // First, try to get all stores to debug
      const { data: allStores, error: debugError } = await supabase
        .from('stores')
        .select('id, name, address, phone, is_active')
        .eq('is_active', true);
      
      console.log('📊 All active stores:', allStores);
      console.log('❌ Debug error:', debugError);

      let query = supabase
        .from('stores')
        .select('name, address, phone')
        .eq('is_active', true);

      if (storeId) {
        query = query.eq('id', storeId);
        console.log('🎯 Querying specific store with ID:', storeId);
      } else {
        console.log('🔄 No storeId provided, getting first active store');
      }

      const { data, error } = await query.single();

      console.log('📋 Store query result:', { data, error });

      if (error) {
        console.warn('⚠️ Failed to fetch store info:', error);
        
        // If specific store not found, try getting any active store
        if (storeId && error.code === 'PGRST116') {
          console.log('🔄 Specific store not found, trying to get any active store...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('stores')
            .select('name, address, phone')
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (!fallbackError && fallbackData) {
            console.log('✅ Found fallback store:', fallbackData);
            return {
              name: fallbackData.name || 'Smart Laundry POS',
              address: fallbackData.address || 'Alamat belum diset',
              phone: fallbackData.phone || 'Nomor telepon belum diset',
            };
          }
        }
        
        // Return default store info as fallback
        console.log('🔧 Using default fallback store info');
        return {
          name: 'Smart Laundry POS',
          address: 'Alamat belum diset - silakan update di pengaturan toko',
          phone: 'Nomor telepon belum diset',
        };
      }

      console.log('✅ Successfully fetched store info:', data);
      return {
        name: data.name || 'Smart Laundry POS',
        address: data.address || 'Alamat belum diset - silakan update di pengaturan toko',
        phone: data.phone || 'Nomor telepon belum diset',
      };
    } catch (error) {
      console.error('💥 Error fetching store info:', error);
      // Return default store info as fallback
      return {
        name: 'Smart Laundry POS',
        address: 'Alamat belum diset - silakan update di pengaturan toko',
        phone: 'Nomor telepon belum diset',
      };
    }
  }

  /**
   * Get store info from store context data (alternative method)
   */
  static getStoreInfoFromContext(storeData: any): StoreInfo {
    console.log('🏪 Getting store info from context:', storeData);
    
    if (!storeData) {
      console.log('⚠️ No store data provided from context');
      return {
        name: 'Smart Laundry POS',
        address: 'Alamat belum diset - silakan update di pengaturan toko',
        phone: 'Nomor telepon belum diset',
      };
    }

    return {
      name: storeData.store_name || storeData.name || 'Smart Laundry POS',
      address: storeData.store_address || storeData.address || 'Alamat belum diset - silakan update di pengaturan toko',
      phone: storeData.store_phone || storeData.phone || 'Nomor telepon belum diset',
    };
  }

  /**
   * Convert order items data to WhatsApp format
   */
  static formatOrderItems(items: any[]): OrderItem[] {
    return items.map(item => ({
      service_name: item.service_name,
      service_type: item.service_type || 'unit',
      weight_kg: item.weight_kg,
      quantity: item.quantity || 1,
      service_price: item.service_price,
      line_total: item.line_total || (item.service_price * (item.quantity || 1)),
    }));
  }

  /**
   * Get payment status in a format suitable for WhatsApp messages
   */
  static getFormattedPaymentStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Belum Lunas',
      'completed': 'Lunas',
      'down_payment': 'DP',
      'partial': 'Sebagian',
      'refunded': 'Dikembalikan'
    };
    return statusMap[status] || status;
  }

  /**
   * Format estimated completion date for WhatsApp message
   */
  static formatEstimatedCompletion(dateString?: string): string {
    if (!dateString) {
      return 'Akan dikonfirmasi';
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Akan dikonfirmasi';
    }
  }

  /**
   * Format completion date for WhatsApp message
   */
  static formatCompletionDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Error formatting completion date:', error);
      return new Date().toLocaleDateString('id-ID');
    }
  }
}
