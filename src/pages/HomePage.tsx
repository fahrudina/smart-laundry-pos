import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboard } from '@/hooks/useDashboard';
// import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  usePageTitle('Home - Smart Laundry POS');
  const { currentStore } = useStore();
  const { metrics, recentOrders, loading } = useDashboard();

  // Show store selection message if no store is selected
  if (!currentStore) {
    return (
      <div className="space-y-8">
        {/* <DashboardHeader /> */}
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Store Selected
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a store to view the dashboard data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      {/* <DashboardHeader /> */}
      
      {/* Today's Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📊 Today's Overview
        </h2>
        <OverviewCards metrics={metrics} loading={loading} />
      </div>

      {/* Quick Actions */}
      <div>
        <QuickActions />
      </div>

      {/* Recent Orders */}
      <div>
        <RecentOrders orders={recentOrders} loading={loading} />
      </div>
    </div>
  );
};
