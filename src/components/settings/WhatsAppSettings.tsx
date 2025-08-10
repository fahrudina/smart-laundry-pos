import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Settings, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { MockWhatsAppService, createMockOrderData, runBasicTests } from '@/integrations/whatsapp/__tests__/mock-service';

interface WhatsAppSettingsProps {
  onClose?: () => void;
}

export const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ onClose }) => {
  const { isConfigured, isTestingConnection, testConnection, features, sendCustomMessage } = useWhatsApp();
  
  const [config, setConfig] = useState({
    baseUrl: 'http://localhost:8080',
    username: 'admin',
    password: '',
    timeout: 10000,
  });
  
  const [testPhoneNumber, setTestPhoneNumber] = useState('+628123456789');
  const [testMessage, setTestMessage] = useState('Test message from Smart Laundry POS 🧺');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleConfigChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    const result = await testConnection();
    addTestResult(`Connection test: ${result ? 'SUCCESS' : 'FAILED'}`);
  };

  const handleSendTestMessage = async () => {
    if (!testPhoneNumber || !testMessage) return;
    
    setIsSendingTest(true);
    try {
      const result = await sendCustomMessage(testPhoneNumber, testMessage);
      addTestResult(`Test message: ${result.success ? 'SENT' : 'FAILED'} - ${result.error || 'Success'}`);
    } catch (error) {
      addTestResult(`Test message: ERROR - ${error}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRunMockTests = async () => {
    addTestResult('Starting mock tests...');
    const mockService = new MockWhatsAppService();
    
    try {
      await runBasicTests(mockService);
      addTestResult('Mock tests completed successfully');
      addTestResult(`Mock service sent ${mockService.getMessageCount()} messages`);
    } catch (error) {
      addTestResult(`Mock tests failed: ${error}`);
    }
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <h2 className="text-2xl font-bold">WhatsApp Integration</h2>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Status & Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Service Status:</span>
            <Badge variant={isConfigured ? 'default' : 'destructive'} className="flex items-center space-x-1">
              {isConfigured ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              <span>{isConfigured ? 'Configured' : 'Not Configured'}</span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Global Enable:</span>
              <Badge variant={features.enabled ? 'default' : 'secondary'}>
                {features.enabled ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Development Mode:</span>
              <Badge variant={features.developmentMode ? 'outline' : 'secondary'}>
                {features.developmentMode ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Order Created Notifications:</span>
              <Badge variant={features.notifyOnOrderCreated ? 'default' : 'secondary'}>
                {features.notifyOnOrderCreated ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Order Completed Notifications:</span>
              <Badge variant={features.notifyOnOrderCompleted ? 'default' : 'secondary'}>
                {features.notifyOnOrderCompleted ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure your WhatsApp API settings. These values are typically set via environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseUrl">API Base URL</Label>
              <Input
                id="baseUrl"
                value={config.baseUrl}
                onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                placeholder="http://localhost:8080"
              />
            </div>
            <div>
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) || 10000)}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="your_secure_password"
              />
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Note:</strong> For production use, configure these settings via environment variables:
              <br />
              <code className="text-xs">
                VITE_WHATSAPP_API_URL, VITE_WHATSAPP_API_USERNAME, VITE_WHATSAPP_API_PASSWORD
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>Testing & Validation</span>
          </CardTitle>
          <CardDescription>
            Test your WhatsApp integration to ensure it's working properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Test */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <span className="text-sm text-muted-foreground">
              Test API connectivity and authentication
            </span>
          </div>

          <Separator />

          {/* Message Test */}
          <div className="space-y-2">
            <Label>Test Message</Label>
            <div className="flex space-x-2">
              <Input
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+628123456789"
                className="w-1/3"
              />
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test message"
                className="flex-1"
              />
              <Button 
                onClick={handleSendTestMessage}
                disabled={isSendingTest || !testPhoneNumber || !testMessage}
                size="sm"
              >
                {isSendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>

          <Separator />

          {/* Mock Tests */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleRunMockTests}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Run Mock Tests
            </Button>
            <span className="text-sm text-muted-foreground">
              Run integration tests with mock service
            </span>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Test Results</Label>
                <Button onClick={clearTestResults} variant="ghost" size="sm">
                  Clear
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs">
                  {testResults.join('\n')}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            Example API request for manual testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
            <pre className="text-xs overflow-x-auto">
{`# Send a WhatsApp message
curl -X POST http://localhost:8080/api/send-message \\
  -u admin:your_secure_password \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "message": "Hello from WhatsPoints API!"
  }'

# Expected Response:
{
  "success": true,
  "message": "Message sent successfully",
  "id": "message_id_here"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
