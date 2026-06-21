import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { PWAInstallInstructions } from '@/components/ui/PWAInstallInstructions';

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
  const { isInstallable, isInstalled, installPWA, canInstall, browserInfo, needsSpecialInstructions } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

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

  const handleInstallClick = async () => {
    // For devices that need special instructions (MIUI, iOS, etc), show dialog
    if (needsSpecialInstructions || browserInfo.isMIUI) {
      setShowInstructions(true);
    } else {
      // Otherwise, try standard PWA install
      await installPWA();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const buttonText = browserInfo.isMIUI ? 'Lihat Cara Install' :
                     isIOS ? 'Tambah ke Home' :
                     'Install App';

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 ${className}`}
        title={browserInfo.isMIUI ? 'Cara Install di MIUI' : isIOS ? 'Tambah ke Layar Utama' : 'Install Aplikasi'}
      >
        {isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {showText && (
          <span className="hidden sm:inline">
            {buttonText}
          </span>
        )}
      </Button>

      <PWAInstallInstructions
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />
    </>
  );
};
