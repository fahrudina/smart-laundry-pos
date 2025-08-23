import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { InventoryStatus } from '@/hooks/useReporting';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InventoryStatusChartProps {
  data: InventoryStatus[];
  loading: boolean;
}

const chartConfig = {
  level: {
    label: "Stock Level",
    color: "hsl(221, 83%, 53%)",
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'high':
      return '#10B981'; // Green
    case 'medium':
      return '#F59E0B'; // Yellow
    case 'low':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const InventoryStatusChart: React.FC<InventoryStatusChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    fill: getStatusColor(item.status)
  }));

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="item" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <div className="font-medium">{label}</div>
                            <div className="text-sm text-muted-foreground">
                              Level: {data.level}%
                            </div>
                            <div className="text-sm">
                              <Badge variant={getStatusBadgeVariant(data.status)}>
                                {data.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="level" 
                    fill={(entry) => entry.fill}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Status List */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Current Status</h4>
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    />
                    <span className="font-medium">{item.item}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.level}%</span>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Alert for low stock */}
            {data.some(item => item.status === 'low') && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Some items are running low on stock. Consider restocking soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};