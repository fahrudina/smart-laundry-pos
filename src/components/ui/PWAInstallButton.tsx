import React from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showText?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  showText = true
}) => {
  const { isInstallable, isInstalled, installPWA, canInstall } = usePWAInstall();

  // Don't show button if not installable or already installed
  if (!canInstall && !isInstalled) return null;

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 text-green-600 text-sm ${className}`}>
        <Check className="h-4 w-4" />
        {showText && <span>Aplikasi Terpasang</span>}
      </div>
    );
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <Button
      onClick={installPWA}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 ${className}`}
      title={isIOS ? 'Tambah ke Layar Utama' : 'Install Aplikasi'}
    >
      {isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {showText && (
        <span className="hidden sm:inline">
          {isIOS ? 'Tambah ke Home' : 'Install App'}
        </span>
      )}
    </Button>
  );
};
