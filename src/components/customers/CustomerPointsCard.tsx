import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp, Award, Clock } from 'lucide-react';
import { useCustomerPoints, useCustomerPointTransactions } from '@/hooks/useCustomerPoints';
import { useStore } from '@/contexts/StoreContext';

interface CustomerPointsCardProps {
  customerPhone: string;
  showTransactions?: boolean;
  compact?: boolean;
}

export const CustomerPointsCard: React.FC<CustomerPointsCardProps> = ({
  customerPhone,
  showTransactions = false,
  compact = false,
}) => {
  const { currentStore } = useStore();
  const { data: points, isLoading: pointsLoading } = useCustomerPoints(customerPhone);
  const { data: transactions, isLoading: transactionsLoading } = useCustomerPointTransactions(
    customerPhone,
    5
  );

  // Don't show points card if store doesn't have points enabled
  if (!currentStore?.enable_points) {
    return null;
  }

  if (pointsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Poin Loyalitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!points) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Poin Loyalitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Belum ada poin</p>
            <p className="text-xs mt-1">Poin akan diberikan setelah pembayaran lunas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const redeemed = points.accumulated_points - points.current_points;

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="flex items-center justify-center w-12 h-12 bg-amber-500 rounded-full">
          <Star className="h-6 w-6 text-white fill-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">Poin Tersedia</p>
          <p className="text-2xl font-bold text-amber-600">{points.current_points}</p>
        </div>
        {points.accumulated_points > points.current_points && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Terkumpul</p>
            <p className="text-sm font-semibold text-gray-700">{points.accumulated_points}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Poin Loyalitas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Points Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Points */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5" />
              <p className="text-sm font-medium opacity-90">Poin Tersedia</p>
            </div>
            <p className="text-3xl font-bold">{points.current_points}</p>
            <p className="text-xs opacity-75 mt-1">Dapat digunakan</p>
          </div>

          {/* Accumulated Points */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <p className="text-sm font-medium opacity-90">Total Terkumpul</p>
            </div>
            <p className="text-3xl font-bold">{points.accumulated_points}</p>
            <p className="text-xs opacity-75 mt-1">Sepanjang masa</p>
          </div>

          {/* Redeemed Points */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 fill-white" />
              <p className="text-sm font-medium opacity-90">Telah Ditukar</p>
            </div>
            <p className="text-3xl font-bold">{redeemed}</p>
            <p className="text-xs opacity-75 mt-1">Poin terpakai</p>
          </div>
        </div>

        {/* Points Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">💡 Cara Mendapat Poin</p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
            <li>1 poin per kilogram untuk layanan kiloan</li>
            <li>1 poin per unit untuk layanan satuan</li>
            <li>Poin otomatis diberikan saat pembayaran lunas</li>
          </ul>
        </div>

        {/* Recent Transactions */}
        {showTransactions && transactions && transactions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Riwayat Terakhir
            </h4>
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    {transaction.transaction_type === 'earning' ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Star className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.transaction_type === 'earning' ? 'Dapat Poin' : 'Tukar Poin'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={transaction.transaction_type === 'earning' ? 'default' : 'secondary'}
                    className={
                      transaction.transaction_type === 'earning'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }
                  >
                    {transaction.points_changed > 0 ? '+' : ''}
                    {transaction.points_changed}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
