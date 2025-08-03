import React from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallPromptProps {
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, installPWA } = usePWAInstall();

  if (!isInstallable) return null;

  const handleInstall = () => {
    installPWA();
    onDismiss();
  };

  return (
    <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Download className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Install Smart Laundry POS</h4>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            Install our app for faster access and offline support
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Install Now
            </Button>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-blue-600 hover:text-blue-700"
            >
              Not Now
            </Button>
          </div>
        </div>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600 ml-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
