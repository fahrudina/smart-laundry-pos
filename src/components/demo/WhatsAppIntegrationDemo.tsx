import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, CheckCircle, XCircle, Info } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';

/**
 * WhatsApp Integration Demo Component
 * Shows how to integrate WhatsApp notifications into existing components
 */
export const WhatsAppIntegrationDemo: React.FC = () => {
  const { 
    isConfigured, 
    notifyOrderCreated, 
    notifyOrderCompleted, 
    sendCustomMessage,
    features 
  } = useWhatsApp();

  // Demo functions
  const handleTestOrderCreated = async () => {
    await notifyOrderCreated('+628123456789', {
      orderId: 'DEMO123',
      customerName: 'John Doe',
      totalAmount: 75000,
      estimatedCompletion: new Date().toLocaleDateString('id-ID'),
      services: ['Cuci Biasa', 'Setrika'],
    });
  };

  const handleTestOrderCompleted = async () => {
    await notifyOrderCompleted('+628123456789', {
      orderId: 'DEMO123',
      customerName: 'John Doe',
      totalAmount: 75000,
      completedAt: new Date().toLocaleDateString('id-ID'),
      services: ['Cuci Biasa', 'Setrika'],
    });
  };

  const handleCustomMessage = async () => {
    await sendCustomMessage(
      '+628123456789',
      'Halo! Ini adalah pesan demo dari Smart Laundry POS 🧺✨'
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WhatsApp Integration Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test and configure WhatsApp notifications for your laundry POS
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Service Status:</span>
            <Badge 
              variant={isConfigured ? 'default' : 'destructive'} 
              className="flex items-center space-x-1"
            >
              {isConfigured ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>{isConfigured ? 'Ready' : 'Not Configured'}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Enabled:</span>
              <Badge variant={features.enabled ? 'default' : 'secondary'}>
                {features.enabled ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Dev Mode:</span>
              <Badge variant={features.developmentMode ? 'outline' : 'secondary'}>
                {features.developmentMode ? 'On' : 'Off'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Order Created:</span>
              <Badge variant={features.notifyOnOrderCreated ? 'default' : 'secondary'}>
                {features.notifyOnOrderCreated ? 'On' : 'Off'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Order Completed:</span>
              <Badge variant={features.notifyOnOrderCompleted ? 'default' : 'secondary'}>
                {features.notifyOnOrderCompleted ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>

          {!isConfigured && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                WhatsApp integration is not configured. Configure environment variables or use the settings below.
              </AlertDescription>
            </Alert>
          )}

          {features.developmentMode && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Development mode is active. Messages will be logged instead of sent.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Demo Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleTestOrderCreated}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Test Order Created
            </Button>
            
            <Button 
              onClick={handleTestOrderCompleted}
              className="w-full"
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Order Completed
            </Button>
            
            <Button 
              onClick={handleCustomMessage}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Custom Message
            </Button>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Test messages will be sent to +628123456789. 
              {features.developmentMode ? ' (Development mode: messages will be logged only)' : ''}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Integration Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2">1. Automatic Order Creation Notifications</h4>
            <pre className="text-xs overflow-x-auto">
{`// Replace existing useCreateOrder import
import { useCreateOrderWithNotifications as useCreateOrder } 
  from '@/hooks/useOrdersWithNotifications';

// Use exactly the same - notifications are automatic!
const createOrderMutation = useCreateOrder();
await createOrderMutation.mutateAsync(orderData);`}
            </pre>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2">2. Manual Notifications</h4>
            <pre className="text-xs overflow-x-auto">
{`import { useWhatsApp } from '@/hooks/useWhatsApp';

const { notifyOrderCompleted } = useWhatsApp();

await notifyOrderCompleted(customerPhone, {
  orderId: order.id,
  customerName: order.customer_name,
  totalAmount: order.total_amount,
  completedAt: new Date().toLocaleDateString('id-ID'),
  services: order.order_items.map(item => item.service_name),
});`}
            </pre>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2">3. Check WhatsApp Status in Components</h4>
            <pre className="text-xs overflow-x-auto">
{`const { isConfigured, features } = useWhatsApp();

// Show status in UI
<Badge variant={isConfigured ? 'default' : 'secondary'}>
  WhatsApp {isConfigured ? 'ON' : 'OFF'}
</Badge>`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <WhatsAppSettings />
    </div>
  );
};
