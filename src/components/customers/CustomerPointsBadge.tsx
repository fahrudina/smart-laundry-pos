import React from 'react';
import { Star } from 'lucide-react';
import { useCustomerPoints } from '@/hooks/useCustomerPoints';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/contexts/StoreContext';

interface CustomerPointsBadgeProps {
  customerPhone: string;
}

export const CustomerPointsBadge: React.FC<CustomerPointsBadgeProps> = ({ customerPhone }) => {
  const { currentStore } = useStore();
  const { data: points, isLoading } = useCustomerPoints(customerPhone);

  // Don't show badge if store doesn't have points enabled
  if (!currentStore?.enable_points) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-16" />;
  }

  if (!points || points.current_points === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Star className="h-3 w-3" />
        <span>0</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      <span>{points.current_points}</span>
    </span>
  );
};
