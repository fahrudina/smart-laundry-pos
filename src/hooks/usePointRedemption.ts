import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

export const POINTS_TO_RUPIAH_RATE = 100; // 1 point = Rp100

export interface RedeemPointsParams {
  customerPhone: string;
  pointsToRedeem: number;
  orderId: string;
  orderAmount: number;
}

/**
 * Hook to redeem customer loyalty points
 * Validates available points and creates redemption transaction
 */
export const useRedeemPoints = () => {
  const { currentStore } = useStore();

  return useMutation({
    mutationFn: async ({ customerPhone, pointsToRedeem, orderId, orderAmount }: RedeemPointsParams) => {
      if (!currentStore?.store_id) {
        throw new Error('No store selected');
      }

      // Validate points to redeem is positive
      if (pointsToRedeem <= 0) {
        throw new Error('Points to redeem must be greater than 0');
      }

      // Get customer's current points
      const { data: pointsData, error: pointsError } = await supabase
        .from('points')
        .select('point_id, current_points')
        .eq('customer_phone', customerPhone)
        .eq('store_id', currentStore.store_id)
        .maybeSingle();

      if (pointsError) {
        throw new Error('Failed to fetch customer points');
      }

      // Check if customer has a points record
      if (!pointsData) {
        throw new Error('Customer has no points available');
      }

      // Check if customer has enough points
      if (pointsData.current_points < pointsToRedeem) {
        throw new Error(`Insufficient points. Customer has ${pointsData.current_points} points, but ${pointsToRedeem} points were requested.`);
      }

      // Calculate discount amount
      const discountAmount = pointsToRedeem * POINTS_TO_RUPIAH_RATE;

      // Validate discount doesn't exceed order amount
      if (discountAmount > orderAmount) {
        throw new Error('Discount amount cannot exceed order total');
      }

      // Deduct points from customer's account
      const { error: updateError } = await supabase
        .from('points')
        .update({
          current_points: pointsData.current_points - pointsToRedeem,
          updated_at: new Date().toISOString(),
        })
        .eq('point_id', pointsData.point_id);

      if (updateError) {
        throw new Error('Failed to deduct points from customer account');
      }

      // Create redemption transaction record
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          point_id: pointsData.point_id,
          order_id: orderId,
          points_changed: -pointsToRedeem, // Negative for redemption
          transaction_type: 'redemption',
          transaction_date: new Date().toISOString(),
          notes: `Redeemed ${pointsToRedeem} points for Rp${discountAmount.toLocaleString('id-ID')} discount on order ${orderId.slice(0, 8)}`,
        });

      if (transactionError) {
        // Rollback: Add points back if transaction record fails
        await supabase
          .from('points')
          .update({
            current_points: pointsData.current_points,
            updated_at: new Date().toISOString(),
          })
          .eq('point_id', pointsData.point_id);
        
        throw new Error('Failed to create redemption transaction');
      }

      return {
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        remainingPoints: pointsData.current_points - pointsToRedeem,
      };
    },
  });
};

/**
 * Calculate discount amount from points
 */
export const calculateDiscountFromPoints = (points: number): number => {
  return points * POINTS_TO_RUPIAH_RATE;
};

/**
 * Calculate points needed for a specific discount amount
 */
export const calculatePointsFromDiscount = (discountAmount: number): number => {
  return Math.floor(discountAmount / POINTS_TO_RUPIAH_RATE);
};

/**
 * Validate if customer has enough points for redemption
 */
export const validatePointRedemption = (
  pointsToRedeem: number,
  availablePoints: number,
  orderAmount: number
): { valid: boolean; error?: string } => {
  if (pointsToRedeem <= 0) {
    return { valid: false, error: 'Jumlah poin harus lebih dari 0' };
  }

  if (pointsToRedeem > availablePoints) {
    return { 
      valid: false, 
      error: `Poin tidak cukup. Tersedia: ${availablePoints} poin` 
    };
  }

  const discountAmount = calculateDiscountFromPoints(pointsToRedeem);
  if (discountAmount > orderAmount) {
    return { 
      valid: false, 
      error: 'Diskon tidak boleh melebihi total pesanan' 
    };
  }

  return { valid: true };
};
