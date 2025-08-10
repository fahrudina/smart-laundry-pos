import React, { useState } from 'react';
import { Smartphone, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PWAManualInstall } from '@/components/ui/PWAManualInstall';
import { PWADiagnostics } from '@/components/ui/PWADiagnostics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PWAManagementPageProps {
  onBack?: () => void;
}

export const PWAManagementPage: React.FC<PWAManagementPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('install');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          )}
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Smartphone className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Install Aplikasi Smart Laundry POS
            </h1>
            <p className="text-gray-600">
              Install aplikasi untuk pengalaman yang lebih baik dan akses offline
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="install" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Install App
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Diagnostics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="install" className="mt-6">
            <PWAManualInstall />
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-6">
            <PWADiagnostics />
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Jika mengalami kesulitan, silakan hubungi support atau gunakan tab Diagnostics
            untuk troubleshooting masalah PWA.
          </p>
        </div>
      </div>
    </div>
  );
};
