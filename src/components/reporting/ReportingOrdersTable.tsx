import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { ReportOrder } from '@/hooks/useReporting';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportingOrdersTableProps {
  orders: ReportOrder[];
  loading: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
    case 'processing':
      return 'secondary';
    case 'in_queue':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in_queue':
      return 'In Queue';
    case 'in_progress':
      return 'In Progress';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const ReportingOrdersTable: React.FC<ReportingOrdersTableProps> = ({ orders, loading }) => {
  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 text-sm font-medium text-gray-600">Order ID</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Customer</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Service</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Weight</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Total</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Time</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No orders found for this period
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm">
                      <span className="font-mono text-blue-600">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium">
                      {order.customer_name}
                    </td>
                    <td className="py-3 text-sm">
                      {order.service_type}
                    </td>
                    <td className="py-3 text-sm">
                      {order.weight_kg ? `${order.weight_kg} kg` : '-'}
                    </td>
                    <td className="py-3">
                      <Badge variant={getStatusBadgeVariant(order.execution_status)}>
                        {getStatusLabel(order.execution_status)}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};