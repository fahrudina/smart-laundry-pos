import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  History, 
  UserPlus,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AddCustomerDialog } from '@/components/pos/AddCustomerDialog';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      id: 'new-order',
      title: 'New Order',
      description: 'Create new laundry order',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/pos')
    },
    {
      id: 'find-customer',
      title: 'Find Customer',
      description: 'Search customer database',
      icon: Search,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => {
        // Navigate to POS page which has customer search functionality
        navigate('/pos');
      }
    },
    {
      id: 'order-history',
      title: 'Order History',
      description: 'View past orders',
      icon: History,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/order-history')
    }
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center justify-center space-y-3 hover:shadow-md transition-all duration-200"
              onClick={action.onClick}
            >
              <div className={`p-4 rounded-full text-white ${action.color}`}>
                <action.icon className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </div>
            </Button>
          ))}
          
          {/* New Customer Action with Dialog */}
          <AddCustomerDialog
            trigger={
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center justify-center space-y-3 hover:shadow-md transition-all duration-200"
              >
                <div className="p-4 rounded-full text-white bg-orange-500 hover:bg-orange-600">
                  <UserPlus className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">New Customer</h3>
                  <p className="text-sm text-gray-500 mt-1">Add new customer</p>
                </div>
              </Button>
            }
            onCustomerAdded={() => {
              // Could show a success message
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
