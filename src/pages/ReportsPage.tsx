import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useReporting } from '@/hooks/useReporting';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, BarChart3 } from 'lucide-react';
import { ReportingOverviewCards } from '@/components/reporting/ReportingOverviewCards';
import { DailyRevenueTrend } from '@/components/reporting/DailyRevenueTrend';
import { ReportingOrdersTable } from '@/components/reporting/ReportingOrdersTable';
import { ServiceDistributionChart } from '@/components/reporting/ServiceDistributionChart';
import { InventoryStatusChart } from '@/components/reporting/InventoryStatusChart';
import { DateRangeFilter } from '@/components/reporting/DateRangeFilter';

interface DateRange {
  from: Date;
  to: Date;
}

export const ReportsPage: React.FC = () => {
  usePageTitle('Reports - Smart Laundry POS');
  const { currentStore } = useStore();
  
  // Default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  const {
    metrics,
    dailyRevenue,
    orders,
    serviceDistribution,
    inventoryStatus,
    loading
  } = useReporting(dateRange);

  // Show store selection message if no store is selected
  if (!currentStore) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Store Selected
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a store to view reporting data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange} 
      />

      {/* Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📊 Key Metrics
        </h2>
        <ReportingOverviewCards metrics={metrics} loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Daily Revenue Trend */}
        <div>
          <DailyRevenueTrend data={dailyRevenue} loading={loading} />
        </div>

        {/* Service Distribution */}
        <div>
          <ServiceDistributionChart data={serviceDistribution} loading={loading} />
        </div>
      </div>

      {/* Orders Table */}
      <div>
        <ReportingOrdersTable orders={orders} loading={loading} />
      </div>

      {/* Inventory Status */}
      <div>
        <InventoryStatusChart data={inventoryStatus} loading={loading} />
      </div>
    </div>
  );
};