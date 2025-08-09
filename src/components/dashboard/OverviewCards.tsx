import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  DollarSign, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';

interface DashboardMetrics {
  todayOrders: {
    count: number;
    changeFromYesterday: number;
  };
  todayRevenue: {
    amount: number;
    changeFromYesterday: number;
  };
  todayCustomers: {
    count: number;
    changeFromYesterday: number;
  };
  pendingOrders: {
    count: number;
    needsAttention: boolean;
  };
}

interface OverviewCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const ChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
  const isPositive = change >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center text-xs ${colorClass}`}>
      <Icon className="h-3 w-3 mr-1" />
      {isPositive ? '+' : ''}{change}% from yesterday
    </div>
  );
};

export const OverviewCards: React.FC<OverviewCardsProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No store selected
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Orders',
      value: metrics.todayOrders.count.toString(),
      change: metrics.todayOrders.changeFromYesterday,
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Revenue',
      value: formatCurrency(metrics.todayRevenue.amount),
      change: metrics.todayRevenue.changeFromYesterday,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Customers',
      value: metrics.todayCustomers.count.toString(),
      change: metrics.todayCustomers.changeFromYesterday,
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Pending',
      value: metrics.pendingOrders.count.toString(),
      change: null, // No change indicator for pending
      icon: Clock,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      needsAttention: metrics.pendingOrders.needsAttention
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              {card.needsAttention && (
                <Badge variant="destructive" className="text-xs">
                  Needs attention
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.change !== null && (
                <ChangeIndicator change={card.change} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
