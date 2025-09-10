import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { ReportingMetrics } from '@/hooks/useReporting';
import { formatCurrency } from '@/lib/utils';

interface ReportingOverviewCardsProps {
  metrics: ReportingMetrics | null;
  loading: boolean;
}

const ChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
  const isPositive = change >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={`flex items-center text-sm ${
      isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      <Icon className="h-3 w-3 mr-1" />
      {isPositive ? '+' : ''}{change}% from previous period
    </div>
  );
};

export const ReportingOverviewCards: React.FC<ReportingOverviewCardsProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No data available
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Period Revenue',
      value: formatCurrency(metrics.periodRevenue.amount),
      change: metrics.periodRevenue.changeFromPrevious,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Active Service Tickets',
      value: metrics.activeServiceTickets.count.toString(),
      change: metrics.activeServiceTickets.changeFromPrevious,
      icon: Ticket,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Customers Served',
      value: metrics.customersServed.count.toString(),
      change: metrics.customersServed.changeFromPrevious,
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {card.value}
            </div>
            <ChangeIndicator change={card.change} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};